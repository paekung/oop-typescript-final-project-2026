import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Textarea,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { createAppointmentFormPresets } from '../constants';
import type { AppointmentFormValues, Service } from '../types';

type AppointmentFormModalProps = {
  isOpen: boolean;
  title: string;
  initialValues: AppointmentFormValues;
  services: Service[];
  isSubmitting?: boolean;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (values: AppointmentFormValues) => Promise<void>;
};

export function AppointmentFormModal({
  isOpen,
  title,
  initialValues,
  services,
  isSubmitting = false,
  submitLabel,
  onClose,
  onSubmit,
}: AppointmentFormModalProps) {
  const [formValues, setFormValues] = useState<AppointmentFormValues>(initialValues);
  const [selectedPresetId, setSelectedPresetId] = useState('');

  const appointmentPresets = useMemo(() => {
    const selectedServiceId = initialValues.serviceId || services[0]?.id || '';
    const selectedDate = initialValues.appointmentDate || getTodayString();
    return createAppointmentFormPresets(selectedServiceId, selectedDate);
  }, [initialValues.appointmentDate, initialValues.serviceId, services]);

  useEffect(() => {
    if (isOpen) {
      setFormValues(initialValues);
      setSelectedPresetId('');
    }
  }, [initialValues, isOpen]);

  const updateField = <K extends keyof AppointmentFormValues>(
    key: K,
    value: AppointmentFormValues[K],
  ) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);

    const preset = appointmentPresets.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }

    setFormValues({
      ...preset.values,
      serviceId: preset.values.serviceId || formValues.serviceId || services[0]?.id || '',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
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
              {appointmentPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </Select>
            <FormHelperText>
              {selectedPresetId
                ? appointmentPresets.find((preset) => preset.id === selectedPresetId)?.description
                : 'เลือก preset เพื่อเติมข้อมูลลูกค้าและวันเวลาตัวอย่างอย่างรวดเร็ว'}
            </FormHelperText>
          </FormControl>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl isRequired>
                <FormLabel>Service</FormLabel>
                <Select
                  value={formValues.serviceId}
                  onChange={(event) => updateField('serviceId', event.target.value)}
                  placeholder="Select a service"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} · {service.providerName}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Customer name</FormLabel>
                <Input
                  value={formValues.customerName}
                  onChange={(event) => updateField('customerName', event.target.value)}
                  placeholder="Somchai Jaidee"
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Customer phone</FormLabel>
                <Input
                  value={formValues.customerPhone}
                  onChange={(event) => updateField('customerPhone', event.target.value)}
                  placeholder="0812345678"
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Customer email</FormLabel>
                <Input
                  type="email"
                  value={formValues.customerEmail}
                  onChange={(event) => updateField('customerEmail', event.target.value)}
                  placeholder="name@example.com"
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Appointment date</FormLabel>
                <Input
                  type="date"
                  value={formValues.appointmentDate}
                  onChange={(event) => updateField('appointmentDate', event.target.value)}
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
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={formValues.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  rows={4}
                  placeholder="Additional notes or requests"
                />
              </FormControl>
            </GridItem>
          </Grid>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button colorScheme="purple" onClick={() => onSubmit(formValues)} isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function getTodayString(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}
