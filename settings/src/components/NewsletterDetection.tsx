import { useState } from "react";
import {
  Table,
  Button,
  TextInput,
  Modal,
  Badge,
  Paper,
  Stack,
  Group,
  Text,
  Loader,
  Alert,
  Container,
  Title,
  Center,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Providers } from "./Providers";
import { Navigation } from "./Navigation";

const API = "http://localhost:3001/api";

interface Candidate {
  from: string;
  name: string;
  sampleSubjects: string[];
  platform: string | null;
  indicators: string[];
  count: number;
}

interface SearchResult {
  from: string;
  name: string;
  subjects: string[];
  dates: string[];
  count: number;
}

function NewsletterDetectionInner() {
  // Detection state
  const [scanning, setScanning] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Merge modal state
  const [mergeOpen, setMergeOpen] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);

  const mergeForm = useForm({
    initialValues: {
      name: "",
      from: "",
      hashtags: "",
      subject: "",
    },
  });

  const handleScan = async () => {
    setScanning(true);
    setDetectError(null);
    try {
      const res = await fetch(`${API}/newsletters/detect`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) {
        setDetectError(data.error);
      }
      setCandidates(data.candidates || []);
      setHasScanned(true);
    } catch (e) {
      setDetectError(e instanceof Error ? e.message : "Failed to scan");
    } finally {
      setScanning(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `${API}/newsletters/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) {
        setSearchError(data.error);
      }
      setSearchResults(data.results || []);
      setHasSearched(true);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const openMergeModal = (from: string, name: string) => {
    mergeForm.setValues({
      name: name || "",
      from: from,
      hashtags: "",
      subject: "",
    });
    setMergeSuccess(null);
    setMergeOpen(true);
  };

  const handleMerge = async (values: typeof mergeForm.values) => {
    setMerging(true);
    setMergeSuccess(null);
    try {
      const res = await fetch(`${API}/newsletters/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          from: values.from.trim(),
          hashtags: values.hashtags
            ? values.hashtags
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          subject: values.subject
            ? values.subject
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok) {
        setMergeSuccess(`Added "${values.name}" to config`);
        // Remove from candidates list
        setCandidates((prev) =>
          prev.filter((c) => c.from !== values.from)
        );
        // Remove from search results
        setSearchResults((prev) =>
          prev.filter((r) => r.from !== values.from)
        );
        setTimeout(() => setMergeOpen(false), 1200);
      } else {
        setMergeSuccess(null);
        setDetectError(data.error || "Merge failed");
      }
    } catch (e) {
      setDetectError(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setMerging(false);
    }
  };

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="md">
        Newsletter Detection
      </Title>

      {/* Scan Section */}
      <Paper withBorder p="lg" mb="xl">
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={500} size="lg">
              Scan Inbox
            </Text>
            <Text size="sm" c="dimmed">
              Scan recent emails to detect newsletters not yet in your config
            </Text>
          </div>
          <Button onClick={handleScan} loading={scanning} size="md">
            {hasScanned ? "Rescan" : "Scan Inbox"}
          </Button>
        </Group>

        {detectError && (
          <Alert color="red" mb="md" title="Error">
            {detectError}
          </Alert>
        )}

        {scanning && (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader size="lg" />
              <Text c="dimmed" size="sm">
                Connecting to IMAP and scanning emails...
              </Text>
            </Stack>
          </Center>
        )}

        {hasScanned && !scanning && candidates.length === 0 && !detectError && (
          <Text c="dimmed" ta="center" py="lg">
            No new newsletter candidates detected. All detected senders are
            already in your config.
          </Text>
        )}

        {candidates.length > 0 && (
          <>
            <Text size="sm" c="dimmed" mb="sm">
              Found {candidates.length} potential newsletter
              {candidates.length !== 1 ? "s" : ""}
            </Text>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Sender</Table.Th>
                    <Table.Th>Platform</Table.Th>
                    <Table.Th>Emails</Table.Th>
                    <Table.Th>Sample Subjects</Table.Th>
                    <Table.Th>Indicators</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {candidates.map((c) => (
                    <Table.Tr key={c.from}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {c.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {c.from}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {c.platform ? (
                          <Badge variant="light" size="sm">
                            {c.platform}
                          </Badge>
                        ) : (
                          <Text size="xs" c="dimmed">
                            --
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{c.count}</Text>
                      </Table.Td>
                      <Table.Td style={{ maxWidth: 300 }}>
                        {c.sampleSubjects.slice(0, 3).map((s, i) => (
                          <Text key={i} size="xs" c="dimmed" lineClamp={1}>
                            {s}
                          </Text>
                        ))}
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="wrap">
                          {c.indicators.map((ind) => (
                            <Badge
                              key={ind}
                              size="xs"
                              variant="outline"
                              color="gray"
                            >
                              {ind}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => openMergeModal(c.from, c.name)}
                        >
                          Add to Config
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </>
        )}
      </Paper>

      {/* Search Section */}
      <Paper withBorder p="lg">
        <Text fw={500} size="lg" mb="xs">
          Search Emails
        </Text>
        <Text size="sm" c="dimmed" mb="md">
          Search your inbox by sender or subject to find specific newsletters
        </Text>

        <Group mb="md">
          <TextInput
            placeholder="Search by sender or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{ flex: 1 }}
          />
          <Button onClick={handleSearch} loading={searching}>
            Search
          </Button>
        </Group>

        {searchError && (
          <Alert color="red" mb="md" title="Error">
            {searchError}
          </Alert>
        )}

        {searching && (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        )}

        {hasSearched && !searching && searchResults.length === 0 && !searchError && (
          <Text c="dimmed" ta="center" py="lg">
            No results found for "{searchQuery}"
          </Text>
        )}

        {searchResults.length > 0 && (
          <>
            <Text size="sm" c="dimmed" mb="sm">
              Found {searchResults.length} sender
              {searchResults.length !== 1 ? "s" : ""} matching "{searchQuery}"
            </Text>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Sender</Table.Th>
                    <Table.Th>Emails</Table.Th>
                    <Table.Th>Sample Subjects</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {searchResults.map((r) => (
                    <Table.Tr key={r.from}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {r.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {r.from}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{r.count}</Text>
                      </Table.Td>
                      <Table.Td style={{ maxWidth: 300 }}>
                        {r.subjects.slice(0, 3).map((s, i) => (
                          <Text key={i} size="xs" c="dimmed" lineClamp={1}>
                            {s}
                          </Text>
                        ))}
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => openMergeModal(r.from, r.name)}
                        >
                          Add to Config
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </>
        )}
      </Paper>

      {/* Merge Modal */}
      <Modal
        opened={mergeOpen}
        onClose={() => setMergeOpen(false)}
        title="Add Newsletter to Config"
        size="md"
      >
        <form onSubmit={mergeForm.onSubmit(handleMerge)}>
          <Stack>
            <TextInput
              label="Name"
              description="Display name for this newsletter"
              required
              {...mergeForm.getInputProps("name")}
            />
            <TextInput
              label="From (email)"
              description="Sender email address pattern"
              required
              {...mergeForm.getInputProps("from")}
            />
            <TextInput
              label="Subject filters"
              description="Comma-separated subject patterns (optional)"
              {...mergeForm.getInputProps("subject")}
            />
            <TextInput
              label="Hashtags"
              description="Comma-separated, e.g. #tech, #ai"
              {...mergeForm.getInputProps("hashtags")}
            />

            {mergeSuccess && (
              <Alert color="green" title="Success">
                {mergeSuccess}
              </Alert>
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setMergeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={merging}>
                Add to Config
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}

export function NewsletterDetection() {
  return (
    <Providers>
      <Navigation />
      <NewsletterDetectionInner />
    </Providers>
  );
}
