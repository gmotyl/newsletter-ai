import { Group, Anchor, Text } from "@mantine/core";

const links = [
  { label: "Newsletters", href: "/" },
  { label: "Detection", href: "/detect" },
  { label: "Prompt", href: "/prompt" },
  { label: "Settings", href: "/settings" },
];

export function Navigation() {
  return (
    <Group
      p="md"
      style={{ borderBottom: "1px solid var(--mantine-color-dark-4)" }}
    >
      <Text fw={700} size="lg">
        Newsletter AI
      </Text>
      <Group gap="lg">
        {links.map((link) => (
          <Anchor key={link.href} href={link.href} c="dimmed" size="sm">
            {link.label}
          </Anchor>
        ))}
      </Group>
    </Group>
  );
}
