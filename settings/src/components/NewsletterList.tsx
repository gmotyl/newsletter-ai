import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Switch,
  Badge,
  Group,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Stack,
  ActionIcon,
  Text,
  Container,
  Title,
  Paper,
  Loader,
  Center,
  Checkbox,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Providers } from "./Providers";
import { Navigation } from "./Navigation";

const API = "http://localhost:3001/api";

interface NestedScraping {
  enabled: boolean;
  intermediateDomains: string[];
  strategy: string;
  maxDepth?: number;
}

interface NewsletterPattern {
  name: string;
  from: string;
  subject: string[];
  enabled: boolean;
  maxArticles?: number;
  hashtags?: string[];
  nestedScraping?: NestedScraping;
}

interface Config {
  newsletterPatterns: NewsletterPattern[];
  [key: string]: unknown;
}

function NewsletterListInner() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const form = useForm({
    initialValues: {
      name: "",
      from: "",
      subject: "",
      enabled: true,
      maxArticles: 20,
      hashtags: "",
      nestedScrapingEnabled: false,
      intermediateDomains: "",
      strategy: "auto",
      maxDepth: 2,
    },
  });

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/config`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConfig(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = async (updated: Config) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setConfig(updated);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (index: number, enabled: boolean) => {
    if (!config) return;
    const updated = structuredClone(config);
    updated.newsletterPatterns[index].enabled = enabled;
    await saveConfig(updated);
  };

  const openEdit = (index: number) => {
    if (!config) return;
    const p = config.newsletterPatterns[index];
    form.setValues({
      name: p.name,
      from: p.from,
      subject: (p.subject || []).join(", "),
      enabled: p.enabled,
      maxArticles: p.maxArticles ?? 20,
      hashtags: (p.hashtags || []).join(", "),
      nestedScrapingEnabled: p.nestedScraping?.enabled ?? false,
      intermediateDomains: (p.nestedScraping?.intermediateDomains || []).join(
        ", "
      ),
      strategy: p.nestedScraping?.strategy ?? "auto",
      maxDepth: p.nestedScraping?.maxDepth ?? 2,
    });
    setEditIndex(index);
  };

  const handleSaveEdit = async (values: typeof form.values) => {
    if (!config || editIndex === null) return;
    const updated = structuredClone(config);
    const pattern: NewsletterPattern = {
      name: values.name.trim(),
      from: values.from.trim(),
      subject: values.subject
        ? values.subject
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      enabled: values.enabled,
      maxArticles: values.maxArticles,
      hashtags: values.hashtags
        ? values.hashtags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };
    if (values.nestedScrapingEnabled) {
      pattern.nestedScraping = {
        enabled: true,
        intermediateDomains: values.intermediateDomains
          ? values.intermediateDomains
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        strategy: values.strategy,
        maxDepth: values.maxDepth,
      };
    }
    updated.newsletterPatterns[editIndex] = pattern;
    await saveConfig(updated);
    setEditIndex(null);
  };

  const handleDelete = async () => {
    if (!config || deleteIndex === null) return;
    const updated = structuredClone(config);
    updated.newsletterPatterns.splice(deleteIndex, 1);
    await saveConfig(updated);
    setDeleteIndex(null);
  };

  const handleAdd = () => {
    form.reset();
    // Use a sentinel value: patterns.length means "new"
    setEditIndex(config ? config.newsletterPatterns.length : 0);
  };

  const handleSaveNew = async (values: typeof form.values) => {
    if (!config) return;
    const updated = structuredClone(config);
    const pattern: NewsletterPattern = {
      name: values.name.trim(),
      from: values.from.trim(),
      subject: values.subject
        ? values.subject
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      enabled: values.enabled,
      maxArticles: values.maxArticles,
      hashtags: values.hashtags
        ? values.hashtags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };
    if (values.nestedScrapingEnabled) {
      pattern.nestedScraping = {
        enabled: true,
        intermediateDomains: values.intermediateDomains
          ? values.intermediateDomains
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        strategy: values.strategy,
        maxDepth: values.maxDepth,
      };
    }
    updated.newsletterPatterns.push(pattern);
    await saveConfig(updated);
    setEditIndex(null);
  };

  const isNewPattern =
    editIndex !== null &&
    config !== null &&
    editIndex >= config.newsletterPatterns.length;

  const patterns = config?.newsletterPatterns ?? [];
  const filtered = patterns.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.from.toLowerCase().includes(search.toLowerCase()) ||
      (p.hashtags || []).some((h) =>
        h.toLowerCase().includes(search.toLowerCase())
      )
  );

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
          <Button mt="md" onClick={fetchConfig}>
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="md">
        <Title order={2}>Newsletter Patterns</Title>
        <Group>
          {saving && <Loader size="xs" />}
          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}
          <Button onClick={handleAdd}>Add Newsletter</Button>
        </Group>
      </Group>

      <TextInput
        placeholder="Search by name, email, or hashtag..."
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="md"
      />

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>From</Table.Th>
              <Table.Th>Enabled</Table.Th>
              <Table.Th>Hashtags</Table.Th>
              <Table.Th>Articles</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((p) => {
              const realIndex = patterns.indexOf(p);
              return (
                <Table.Tr
                  key={`${p.name}-${p.from}`}
                  style={{ opacity: p.enabled ? 1 : 0.5 }}
                >
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {p.name}
                    </Text>
                    {p.nestedScraping?.enabled && (
                      <Text size="xs" c="dimmed">
                        nested scraping
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {p.from}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Switch
                      checked={p.enabled}
                      onChange={(e) =>
                        handleToggle(realIndex, e.currentTarget.checked)
                      }
                      size="sm"
                    />
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {(p.hashtags || []).map((h) => (
                        <Badge key={h} size="sm" variant="light">
                          {h}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{p.maxArticles ?? 20}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => openEdit(realIndex)}
                          size="sm"
                        >
                          E
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => setDeleteIndex(realIndex)}
                          size="sm"
                        >
                          D
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {filtered.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Center py="xl">
                    <Text c="dimmed">
                      {search
                        ? "No newsletters match your search"
                        : "No newsletter patterns configured"}
                    </Text>
                  </Center>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Text size="sm" c="dimmed" mt="sm">
        {patterns.length} newsletter pattern{patterns.length !== 1 ? "s" : ""}{" "}
        configured
      </Text>

      {/* Edit / Add Modal */}
      <Modal
        opened={editIndex !== null}
        onClose={() => setEditIndex(null)}
        title={isNewPattern ? "Add Newsletter" : "Edit Newsletter"}
        size="lg"
      >
        <form
          onSubmit={form.onSubmit((values) =>
            isNewPattern ? handleSaveNew(values) : handleSaveEdit(values)
          )}
        >
          <Stack>
            <TextInput
              label="Name"
              required
              {...form.getInputProps("name")}
            />
            <TextInput
              label="From (email)"
              required
              {...form.getInputProps("from")}
            />
            <TextInput
              label="Subject filters"
              description="Comma-separated subject patterns"
              {...form.getInputProps("subject")}
            />
            <Checkbox
              label="Enabled"
              {...form.getInputProps("enabled", { type: "checkbox" })}
            />
            <NumberInput
              label="Max articles"
              min={1}
              max={100}
              {...form.getInputProps("maxArticles")}
            />
            <TextInput
              label="Hashtags"
              description="Comma-separated, e.g. #tech, #ai"
              {...form.getInputProps("hashtags")}
            />

            <Text fw={500} mt="sm">
              Nested Scraping
            </Text>
            <Checkbox
              label="Enable nested scraping"
              {...form.getInputProps("nestedScrapingEnabled", {
                type: "checkbox",
              })}
            />
            {form.values.nestedScrapingEnabled && (
              <>
                <TextInput
                  label="Intermediate domains"
                  description="Comma-separated domains"
                  {...form.getInputProps("intermediateDomains")}
                />
                <TextInput
                  label="Strategy"
                  description="auto, redirect, or content"
                  {...form.getInputProps("strategy")}
                />
                <NumberInput
                  label="Max depth"
                  min={1}
                  max={5}
                  {...form.getInputProps("maxDepth")}
                />
              </>
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setEditIndex(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteIndex !== null}
        onClose={() => setDeleteIndex(null)}
        title="Delete Newsletter"
        size="sm"
      >
        <Text>
          Are you sure you want to delete{" "}
          <strong>
            {deleteIndex !== null ? patterns[deleteIndex]?.name : ""}
          </strong>
          ? This cannot be undone.
        </Text>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={() => setDeleteIndex(null)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete} loading={saving}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}

export function NewsletterList() {
  return (
    <Providers>
      <Navigation />
      <NewsletterListInner />
    </Providers>
  );
}
