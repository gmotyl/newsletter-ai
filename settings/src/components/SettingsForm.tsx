import { useState, useEffect, useCallback } from "react";
import {
  Accordion,
  Button,
  Container,
  Group,
  Loader,
  Center,
  NumberInput,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title,
  Badge,
} from "@mantine/core";
import { Providers } from "./Providers";
import { Navigation } from "./Navigation";

const API = "http://localhost:3001/api";

interface NestedScrapingOptions {
  followRedirects: boolean;
  maxRedirects: number;
  timeout: number;
}

interface ScraperOptions {
  timeout: number;
  userAgent: string;
  retryAttempts: number;
  nestedScraping: NestedScrapingOptions;
}

interface ContentFilters {
  skipTopics: string[];
  focusTopics: string[];
  blacklistedUrls: string[];
}

interface ProcessingOptions {
  autoDelete: boolean;
  markAsRead: boolean;
  processAllMessages: boolean;
  messageLimit: number;
}

interface Config {
  newsletterPatterns: unknown[];
  contentFilters: ContentFilters;
  scraperOptions: ScraperOptions;
  processingOptions: ProcessingOptions;
  [key: string]: unknown;
}

const defaultProcessingOptions: ProcessingOptions = {
  autoDelete: true,
  markAsRead: true,
  processAllMessages: true,
  messageLimit: 100,
};

const defaultScraperOptions: ScraperOptions = {
  timeout: 30000,
  userAgent: "Mozilla/5.0 (compatible; NewsletterBot/1.0)",
  retryAttempts: 3,
  nestedScraping: {
    followRedirects: true,
    maxRedirects: 5,
    timeout: 15000,
  },
};

const defaultContentFilters: ContentFilters = {
  skipTopics: [],
  focusTopics: [],
  blacklistedUrls: [],
};

function SettingsFormInner() {
  const [config, setConfig] = useState<Config | null>(null);
  const [savedConfig, setSavedConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [processing, setProcessing] = useState<ProcessingOptions>(
    defaultProcessingOptions
  );
  const [scraper, setScraper] = useState<ScraperOptions>(defaultScraperOptions);
  const [skipTopics, setSkipTopics] = useState("");
  const [focusTopics, setFocusTopics] = useState("");
  const [blacklistedUrls, setBlacklistedUrls] = useState("");

  const populateForm = useCallback((data: Config) => {
    const p = { ...defaultProcessingOptions, ...data.processingOptions };
    const s = {
      ...defaultScraperOptions,
      ...data.scraperOptions,
      nestedScraping: {
        ...defaultScraperOptions.nestedScraping,
        ...data.scraperOptions?.nestedScraping,
      },
    };
    const f = { ...defaultContentFilters, ...data.contentFilters };

    setProcessing(p);
    setScraper(s);
    setSkipTopics((f.skipTopics || []).join(", "));
    setFocusTopics((f.focusTopics || []).join(", "));
    setBlacklistedUrls((f.blacklistedUrls || []).join("\n"));
  }, []);

  useEffect(() => {
    fetch(`${API}/config`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Config) => {
        setConfig(data);
        setSavedConfig(data);
        populateForm(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load config"
        );
        setLoading(false);
      });
  }, [populateForm]);

  const buildConfigFromForm = useCallback((): Config | null => {
    if (!config) return null;
    return {
      ...config,
      processingOptions: { ...processing },
      scraperOptions: { ...scraper },
      contentFilters: {
        skipTopics: skipTopics
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        focusTopics: focusTopics
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        blacklistedUrls: blacklistedUrls
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    };
  }, [config, processing, scraper, skipTopics, focusTopics, blacklistedUrls]);

  const isDirty = useCallback(() => {
    if (!savedConfig) return false;
    const current = buildConfigFromForm();
    if (!current) return false;
    return JSON.stringify({
      processingOptions: current.processingOptions,
      scraperOptions: current.scraperOptions,
      contentFilters: current.contentFilters,
    }) !== JSON.stringify({
      processingOptions: savedConfig.processingOptions,
      scraperOptions: savedConfig.scraperOptions,
      contentFilters: savedConfig.contentFilters,
    });
  }, [savedConfig, buildConfigFromForm]);

  const dirty = isDirty();

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const save = useCallback(async () => {
    const updated = buildConfigFromForm();
    if (!updated) return;
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const res = await fetch(`${API}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setConfig(updated);
      setSavedConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save config");
    } finally {
      setSaving(false);
    }
  }, [buildConfigFromForm]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty && !saving) {
          save();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dirty, saving, save]);

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error && !config) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder>
          <Text c="red" size="lg">
            Error: {error}
          </Text>
          <Button mt="md" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="md">
        <Group>
          <Title order={2}>Settings</Title>
          {dirty && (
            <Badge color="yellow" variant="light">
              Unsaved changes
            </Badge>
          )}
          {saveSuccess && (
            <Badge color="green" variant="light">
              Saved
            </Badge>
          )}
        </Group>
        <Group>
          {saving && <Loader size="xs" />}
          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}
          <Button onClick={save} disabled={!dirty} loading={saving}>
            Save
          </Button>
        </Group>
      </Group>

      <Accordion
        multiple
        defaultValue={["processing", "scraper", "filters", "env"]}
        variant="separated"
      >
        {/* Processing Options */}
        <Accordion.Item value="processing">
          <Accordion.Control>
            <Text fw={500}>Processing Options</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <Switch
                label="Mark as Read"
                description="Mark emails as read after processing"
                checked={processing.markAsRead}
                onChange={(e) =>
                  setProcessing((p) => ({
                    ...p,
                    markAsRead: e.currentTarget.checked,
                  }))
                }
              />
              <Switch
                label="Auto Delete"
                description="Delete emails after processing"
                checked={processing.autoDelete}
                onChange={(e) =>
                  setProcessing((p) => ({
                    ...p,
                    autoDelete: e.currentTarget.checked,
                  }))
                }
              />
              <Switch
                label="Process All Messages"
                description="Process all matching messages, not just unread"
                checked={processing.processAllMessages}
                onChange={(e) =>
                  setProcessing((p) => ({
                    ...p,
                    processAllMessages: e.currentTarget.checked,
                  }))
                }
              />
              <NumberInput
                label="Message Limit"
                description="Maximum number of messages to process per run"
                min={1}
                max={1000}
                value={processing.messageLimit}
                onChange={(val) =>
                  setProcessing((p) => ({
                    ...p,
                    messageLimit: typeof val === "number" ? val : p.messageLimit,
                  }))
                }
                style={{ maxWidth: 200 }}
              />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Scraper Options */}
        <Accordion.Item value="scraper">
          <Accordion.Control>
            <Text fw={500}>Scraper Options</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <NumberInput
                label="Timeout (ms)"
                description="Request timeout in milliseconds"
                min={1000}
                max={120000}
                step={1000}
                value={scraper.timeout}
                onChange={(val) =>
                  setScraper((s) => ({
                    ...s,
                    timeout: typeof val === "number" ? val : s.timeout,
                  }))
                }
                style={{ maxWidth: 200 }}
              />
              <NumberInput
                label="Retry Attempts"
                description="Number of retries on failure"
                min={0}
                max={10}
                value={scraper.retryAttempts}
                onChange={(val) =>
                  setScraper((s) => ({
                    ...s,
                    retryAttempts:
                      typeof val === "number" ? val : s.retryAttempts,
                  }))
                }
                style={{ maxWidth: 200 }}
              />
              <TextInput
                label="User Agent"
                description="HTTP User-Agent header for scraping requests"
                value={scraper.userAgent}
                onChange={(e) =>
                  setScraper((s) => ({
                    ...s,
                    userAgent: e.currentTarget.value,
                  }))
                }
              />

              <Text fw={500} size="sm" mt="sm">
                Nested Scraping
              </Text>
              <Switch
                label="Follow Redirects"
                description="Follow redirect chains when scraping"
                checked={scraper.nestedScraping.followRedirects}
                onChange={(e) =>
                  setScraper((s) => ({
                    ...s,
                    nestedScraping: {
                      ...s.nestedScraping,
                      followRedirects: e.currentTarget.checked,
                    },
                  }))
                }
              />
              <NumberInput
                label="Max Redirects"
                description="Maximum number of redirects to follow"
                min={1}
                max={20}
                value={scraper.nestedScraping.maxRedirects}
                onChange={(val) =>
                  setScraper((s) => ({
                    ...s,
                    nestedScraping: {
                      ...s.nestedScraping,
                      maxRedirects:
                        typeof val === "number"
                          ? val
                          : s.nestedScraping.maxRedirects,
                    },
                  }))
                }
                style={{ maxWidth: 200 }}
              />
              <NumberInput
                label="Nested Timeout (ms)"
                description="Timeout for nested scraping requests"
                min={1000}
                max={60000}
                step={1000}
                value={scraper.nestedScraping.timeout}
                onChange={(val) =>
                  setScraper((s) => ({
                    ...s,
                    nestedScraping: {
                      ...s.nestedScraping,
                      timeout:
                        typeof val === "number"
                          ? val
                          : s.nestedScraping.timeout,
                    },
                  }))
                }
                style={{ maxWidth: 200 }}
              />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Content Filters */}
        <Accordion.Item value="filters">
          <Accordion.Control>
            <Text fw={500}>Content Filters</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <TextInput
                label="Skip Topics"
                description="Comma-separated list of topics to skip"
                placeholder="e.g. sponsored, job listings, events"
                value={skipTopics}
                onChange={(e) => setSkipTopics(e.currentTarget.value)}
              />
              <TextInput
                label="Focus Topics"
                description="Comma-separated list of topics to prioritize"
                placeholder="e.g. react, typescript, performance"
                value={focusTopics}
                onChange={(e) => setFocusTopics(e.currentTarget.value)}
              />
              <Textarea
                label="Blacklisted URLs"
                description="One URL per line — articles from these domains will be skipped"
                placeholder={"example.com\nspam-site.org"}
                autosize
                minRows={5}
                maxRows={20}
                value={blacklistedUrls}
                onChange={(e) =>
                  setBlacklistedUrls(e.currentTarget.value)
                }
                styles={{
                  input: {
                    fontFamily: "monospace",
                    fontSize: "13px",
                  },
                }}
              />
              <Text size="xs" c="dimmed">
                {
                  blacklistedUrls
                    .split("\n")
                    .filter((l) => l.trim()).length
                }{" "}
                URL{blacklistedUrls.split("\n").filter((l) => l.trim()).length !== 1 ? "s" : ""}{" "}
                blacklisted
              </Text>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Environment Info (Read-only) */}
        <Accordion.Item value="env">
          <Accordion.Control>
            <Text fw={500}>Environment Info</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                These values come from environment variables (.env file). Edit
                the .env file directly to change them.
              </Text>
              <TextInput
                label="Output Path"
                value={String((config as Record<string, unknown>)?.outputPath ?? "")}
                readOnly
                variant="filled"
              />
              <TextInput
                label="Output Language"
                value={String((config as Record<string, unknown>)?.outputLanguage ?? "")}
                readOnly
                variant="filled"
              />
              <TextInput
                label="Narrator Persona"
                value={String((config as Record<string, unknown>)?.narratorPersona ?? "")}
                readOnly
                variant="filled"
              />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Group justify="space-between" mt="md">
        <Text size="xs" c="dimmed">
          Ctrl+S / Cmd+S to save
        </Text>
        <Button onClick={save} disabled={!dirty} loading={saving}>
          Save Settings
        </Button>
      </Group>
    </Container>
  );
}

export function SettingsForm() {
  return (
    <Providers>
      <Navigation />
      <SettingsFormInner />
    </Providers>
  );
}
