import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Switch,
  Textarea,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { DAYS_OF_WEEK, SERVICE_CATEGORIES, SERVICE_FORM_PRESETS } from '../constants';
import type { DayOfWeek, ServiceFormValues } from '../types';

type ServiceFormModalProps = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  title: string;
  initialValues: ServiceFormValues;
  isSubmitting?: boolean;
  onClose: () => void;
  onCreate?: (values: ServiceFormValues) => Promise<void>;
  onUpdate?: (values: ServiceFormValues) => Promise<void>;
  onPatch?: (values: ServiceFormValues) => Promise<void>;
};

export function ServiceFormModal({
  isOpen,
  mode,
  title,
  initialValues,
  isSubmitting = false,
  onClose,
  onCreate,
  onUpdate,
  onPatch,
}: ServiceFormModalProps) {
  const [formValues, setFormValues] = useState<ServiceFormValues>(initialValues);
  const [selectedPresetId, setSelectedPresetId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormValues(initialValues);
      setSelectedPresetId('');
    }
  }, [initialValues, isOpen]);

  const updateField = <K extends keyof ServiceFormValues>(
    key: K,
    value: ServiceFormValues[K],
  ) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  const toggleDay = (day: DayOfWeek) => {
    setFormValues((current) => {
      const hasDay = current.availableDays.includes(day);
      return {
        ...current,
        availableDays: hasDay
          ? current.availableDays.filter((item) => item !== day)
          : [...current.availableDays, day],
      };
    });
  };

  const handleCreate = async () => {
    if (onCreate) {
      await onCreate(formValues);
    }
  };

  const handleUpdate = async () => {
    if (onUpdate) {
      await onUpdate(formValues);
    }
  };

  const handlePatch = async () => {
    if (onPatch) {
      await onPatch(formValues);
    }
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);

    const preset = SERVICE_FORM_PRESETS.find((item) => item.id === presetId);
    if (preset) {
      setFormValues(preset.values);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={5}>
            <FormLabel>Preset data</FormLabel>
            <Select
              value={selectedPresetId}
              onChange={(event) => handlePresetChange(event.target.value)}
              placeholder="Choose preset data"
            >
              {SERVICE_FORM_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </Select>
            <FormHelperText>
              {selectedPresetId
                ? SERVICE_FORM_PRESETS.find((preset) => preset.id === selectedPresetId)?.description
                : 'เลือก preset เพื่อเติมข้อมูลตัวอย่างลงในฟอร์มทันที'}
            </FormHelperText>
          </FormControl>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formValues.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Thai Massage"
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Provider name</FormLabel>
                <Input
                  value={formValues.providerName}
                  onChange={(event) => updateField('providerName', event.target.value)}
                  placeholder="Provider or business name"
                />
              </FormControl>
            </GridItem>
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formValues.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Describe the service"
                  rows={4}
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  value={formValues.category}
                  onChange={(event) => updateField('category', event.target.value as ServiceFormValues['category'])}
                >
                  {SERVICE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Price (THB)</FormLabel>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formValues.price}
                  onChange={(event) => updateField('price', Number(event.target.value))}
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Duration (minutes)</FormLabel>
                <Input
                  type="number"
                  min={1}
                  value={formValues.durationMinutes}
                  onChange={(event) => updateField('durationMinutes', Number(event.target.value))}
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Buffer (minutes)</FormLabel>
                <Input
                  type="number"
                  min={0}
                  value={formValues.bufferMinutes}
                  onChange={(event) => updateField('bufferMinutes', Number(event.target.value))}
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Start time</FormLabel>
                <Input
                  type="time"
                  value={formValues.startTime}
                  onChange={(event) => updateField('startTime', event.target.value)}
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>End time</FormLabel>
                <Input
                  type="time"
                  value={formValues.endTime}
                  onChange={(event) => updateField('endTime', event.target.value)}
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Max concurrent bookings</FormLabel>
                <Input
                  type="number"
                  min={1}
                  value={formValues.maxConcurrentBookings}
                  onChange={(event) => updateField('maxConcurrentBookings', Number(event.target.value))}
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl display="flex" alignItems="center" h="100%">
                <Switch
                  isChecked={formValues.isActive}
                  onChange={(event) => updateField('isActive', event.target.checked)}
                  mr={3}
                />
                <FormLabel mb={0}>Active service</FormLabel>
              </FormControl>
            </GridItem>
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl isRequired>
                <FormLabel>Available days</FormLabel>
                <Flex gap={3} wrap="wrap">
                  {DAYS_OF_WEEK.map((day) => (
                    <Checkbox
                      key={day}
                      isChecked={formValues.availableDays.includes(day)}
                      onChange={() => toggleDay(day)}
                    >
                      {day}
                    </Checkbox>
                  ))}
                </Flex>
              </FormControl>
            </GridItem>
          </Grid>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {mode === 'create' ? (
              <Button colorScheme="purple" onClick={handleCreate} isLoading={isSubmitting}>
                Create service
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handlePatch} isLoading={isSubmitting}>
                  Save with PATCH
                </Button>
                <Button colorScheme="purple" onClick={handleUpdate} isLoading={isSubmitting}>
                  Save with PUT
                </Button>
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
