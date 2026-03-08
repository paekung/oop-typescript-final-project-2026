import { Box, Flex, Heading, Text, type BoxProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

type SectionCardProps = BoxProps & {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function SectionCard({
  title,
  subtitle,
  actions,
  children,
  ...boxProps
}: SectionCardProps) {
  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="2xl"
      boxShadow="sm"
      p={{ base: 4, md: 6 }}
      {...boxProps}
    >
      <Flex
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={3}
        mb={5}
      >
        <Box>
          <Heading size="md">{title}</Heading>
          {subtitle ? (
            <Text mt={1} color="gray.500" fontSize="sm">
              {subtitle}
            </Text>
          ) : null}
        </Box>
        {actions}
      </Flex>
      {children}
    </Box>
  );
}
