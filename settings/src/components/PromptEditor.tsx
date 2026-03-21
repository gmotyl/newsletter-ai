import { useState, useEffect, useCallback } from "react";
import {
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  Container,
  Title,
  Paper,
  Badge,
  Loader,
  Center,
} from "@mantine/core";
import { Providers } from "./Providers";
import { Navigation } from "./Navigation";

const API = "http://localhost:3001/api";

function PromptEditorInner() {
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isDirty = content !== savedContent;

  const lineCount = content.split("\n").length;
  const charCount = content.length;

  useEffect(() => {
    fetch(`${API}/prompt`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setContent(data.content);
        setSavedContent(data.content);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load prompt");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const save = useCallback(async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const res = await fetch(`${API}/prompt`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSavedContent(content);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save prompt");
    } finally {
      setSaving(false);
    }
  }, [content]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && !saving) {
          save();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDirty, saving, save]);

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error && !savedContent && !content) {
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
          <Title order={2}>Prompt Editor</Title>
          {isDirty && (
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
          <Button onClick={save} disabled={!isDirty} loading={saving}>
            Save
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="md">
        <Stack gap="sm">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
            autosize
            minRows={20}
            maxRows={50}
            styles={{
              input: {
                fontFamily: "monospace",
                fontSize: "14px",
                lineHeight: "1.5",
              },
            }}
            placeholder="Enter your prompt template..."
          />
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              {lineCount} line{lineCount !== 1 ? "s" : ""} · {charCount}{" "}
              character{charCount !== 1 ? "s" : ""}
            </Text>
            <Text size="xs" c="dimmed">
              Ctrl+S / Cmd+S to save
            </Text>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}

export function PromptEditor() {
  return (
    <Providers>
      <Navigation />
      <PromptEditorInner />
    </Providers>
  );
}
