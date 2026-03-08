import { Box, Text } from '@chakra-ui/react';

type JsonPreviewProps = {
  value: unknown;
  emptyText?: string;
};

export function JsonPreview({
  value,
  emptyText = 'No payload selected yet.',
}: JsonPreviewProps) {
  if (value === undefined || value === null) {
    return (
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        bg="gray.50"
        p={4}
      >
        <Text color="gray.500">{emptyText}</Text>
      </Box>
    );
  }

  return (
    <Box
      as="pre"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="gray.900"
      color="green.200"
      fontSize="sm"
      overflowX="auto"
      p={4}
      whiteSpace="pre-wrap"
    >
      {JSON.stringify(value, null, 2)}
    </Box>
  );
}
