import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  TableContainer,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClientError, createApiClient } from './api/client';
import { AppointmentFormModal } from './components/AppointmentFormModal';
import { JsonPreview } from './components/JsonPreview';
import { SectionCard } from './components/SectionCard';
import { ServiceFormModal } from './components/ServiceFormModal';
import {
  APPOINTMENT_STATUSES,
  DEFAULT_APPOINTMENT_FILTERS,
  DEFAULT_APPOINTMENT_FORM,
  DEFAULT_SERVICE_FILTERS,
  DEFAULT_SERVICE_FORM,
  SERVICE_CATEGORIES,
} from './constants';
import type {
  ActivityLogEntry,
  Appointment,
  AppointmentFilters,
  AppointmentFormValues,
  AppointmentPatchValues,
  AppointmentStatus,
  Service,
  ServiceFilters,
  ServiceFormValues,
} from './types';
import {
  formatCurrency,
  formatDateTime,
  getChangedServiceFields,
  getStatusColor,
  humanizeEnum,
  summarizeLog,
} from './utils';

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const STORED_BASE_URL_KEY = 'appointment-booking-demo-api-base-url';

export default function App() {
  const toast = useToast();

  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    return window.localStorage.getItem(STORED_BASE_URL_KEY) ?? DEFAULT_API_BASE_URL;
  });
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [serviceFilters, setServiceFilters] = useState<ServiceFilters>(DEFAULT_SERVICE_FILTERS);
  const [appointmentFilters, setAppointmentFilters] = useState<AppointmentFilters>(DEFAULT_APPOINTMENT_FILTERS);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<ActivityLogEntry | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [serviceSlotsDate, setServiceSlotsDate] = useState(getTodayString());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [appointmentPatchStatus, setAppointmentPatchStatus] = useState<'' | AppointmentStatus>('');
  const [appointmentPatchReason, setAppointmentPatchReason] = useState('');
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceCreateDisclosure = useDisclosure();
  const serviceEditDisclosure = useDisclosure();
  const serviceDetailDisclosure = useDisclosure();
  const appointmentCreateDisclosure = useDisclosure();
  const appointmentEditDisclosure = useDisclosure();
  const appointmentDetailDisclosure = useDisclosure();

  useEffect(() => {
    window.localStorage.setItem(STORED_BASE_URL_KEY, apiBaseUrl);
  }, [apiBaseUrl]);

  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl,
        onActivity: (entry) => {
          setActivities((current) => [entry, ...current].slice(0, 30));
          setSelectedLog(entry);
        },
      }),
    [apiBaseUrl],
  );

  const showError = useCallback(
    (error: unknown) => {
      const description =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unexpected error';

      toast({
        title: 'Request failed',
        description,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
    [toast],
  );

  const loadServices = useCallback(
    async (filters: ServiceFilters) => {
      setIsLoadingServices(true);
      try {
        const response = await api.listServices(filters);
        setServices(response.data ?? []);
      } catch (error) {
        showError(error);
      } finally {
        setIsLoadingServices(false);
      }
    },
    [api, showError],
  );

  const loadAppointments = useCallback(
    async (filters: AppointmentFilters) => {
      setIsLoadingAppointments(true);
      try {
        const response = await api.listAppointments(filters);
        setAppointments(response.data ?? []);
      } catch (error) {
        showError(error);
      } finally {
        setIsLoadingAppointments(false);
      }
    },
    [api, showError],
  );

  useEffect(() => {
    void loadServices(serviceFilters);
  }, [loadServices, serviceFilters]);

  useEffect(() => {
    void loadAppointments(appointmentFilters);
  }, [appointmentFilters, loadAppointments]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadServices(serviceFilters), loadAppointments(appointmentFilters)]);
  }, [appointmentFilters, loadAppointments, loadServices, serviceFilters]);

  const openServiceDetails = async (serviceId: string) => {
    try {
      const response = await api.getService(serviceId);
      setSelectedService(response.data);
      setServiceSlotsDate(getTodayString());
      setAvailableSlots([]);
      serviceDetailDisclosure.onOpen();
    } catch (error) {
      showError(error);
    }
  };

  const openAppointmentDetails = async (appointmentId: string) => {
    try {
      const response = await api.getAppointment(appointmentId);
      setSelectedAppointment(response.data);
      setAppointmentPatchStatus(response.data.status);
      setAppointmentPatchReason(response.data.cancellationReason ?? '');
      appointmentDetailDisclosure.onOpen();
    } catch (error) {
      showError(error);
    }
  };

  const handleCreateService = async (values: ServiceFormValues) => {
    setIsSubmitting(true);
    try {
      await api.createService(values);
      serviceCreateDisclosure.onClose();
      await loadServices(serviceFilters);
      toast({ title: 'Service created', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateService = async (values: ServiceFormValues) => {
    if (!selectedService) return;

    setIsSubmitting(true);
    try {
      const response = await api.updateService(selectedService.id, values);
      setSelectedService(response.data);
      serviceEditDisclosure.onClose();
      await loadServices(serviceFilters);
      toast({ title: 'Service updated with PUT', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatchService = async (values: ServiceFormValues) => {
    if (!selectedService) return;

    const changedFields = getChangedServiceFields(mapServiceToFormValues(selectedService), values);
    if (Object.keys(changedFields).length === 0) {
      toast({ title: 'No fields changed', status: 'info', duration: 2500, isClosable: true });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.patchService(selectedService.id, changedFields);
      setSelectedService(response.data);
      serviceEditDisclosure.onClose();
      await loadServices(serviceFilters);
      toast({ title: 'Service updated with PATCH', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickToggleService = async (service: Service) => {
    try {
      const response = await api.patchService(service.id, { isActive: !service.isActive });
      if (selectedService?.id === service.id) {
        setSelectedService(response.data);
      }
      await loadServices(serviceFilters);
      toast({ title: 'Service availability toggled', status: 'success', duration: 2500, isClosable: true });
    } catch (error) {
      showError(error);
    }
  };

  const handleDeleteService = async (service: Service) => {
    const confirmed = window.confirm(`Delete service "${service.name}"?`);
    if (!confirmed) return;

    try {
      await api.deleteService(service.id);
      if (selectedService?.id === service.id) {
        setSelectedService(null);
        serviceDetailDisclosure.onClose();
      }
      await loadServices(serviceFilters);
      await loadAppointments(appointmentFilters);
      toast({ title: 'Service deleted', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      showError(error);
    }
  };

  const handleLoadAvailableSlots = async () => {
    if (!selectedService) return;

    try {
      const response = await api.getAvailableSlots(selectedService.id, serviceSlotsDate);
      setAvailableSlots(response.data ?? []);
      toast({ title: 'Available slots loaded', status: 'success', duration: 2500, isClosable: true });
    } catch (error) {
      showError(error);
    }
  };

  const handleCreateAppointment = async (values: AppointmentFormValues) => {
    setIsSubmitting(true);
    try {
      await api.createAppointment(values);
      appointmentCreateDisclosure.onClose();
      await loadAppointments(appointmentFilters);
      toast({ title: 'Appointment created', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAppointment = async (values: AppointmentFormValues) => {
    if (!selectedAppointment) return;

    setIsSubmitting(true);
    try {
      const response = await api.updateAppointment(selectedAppointment.id, values);
      setSelectedAppointment(response.data);
      appointmentEditDisclosure.onClose();
      await loadAppointments(appointmentFilters);
      toast({ title: 'Appointment updated with PUT', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatchAppointment = async () => {
    if (!selectedAppointment) return;

    const payload: AppointmentPatchValues = {};
    if (appointmentPatchStatus) payload.status = appointmentPatchStatus;
    if (appointmentPatchReason.trim()) payload.cancellationReason = appointmentPatchReason.trim();

    if (Object.keys(payload).length === 0) {
      toast({ title: 'Nothing to patch', status: 'info', duration: 2500, isClosable: true });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.patchAppointment(selectedAppointment.id, payload);
      setSelectedAppointment(response.data);
      await loadAppointments(appointmentFilters);
      toast({ title: 'Appointment updated with PATCH', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAppointment = async (appointment: Appointment) => {
    try {
      const response = await api.confirmAppointment(appointment.id);
      if (selectedAppointment?.id === appointment.id) {
        setSelectedAppointment(response.data);
        setAppointmentPatchStatus(response.data.status);
      }
      await loadAppointments(appointmentFilters);
      toast({ title: 'Appointment confirmed', status: 'success', duration: 2500, isClosable: true });
    } catch (error) {
      showError(error);
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    const reason = window.prompt('Enter cancellation reason');
    if (!reason) return;

    try {
      const response = await api.cancelAppointment(appointment.id, reason);
      if (selectedAppointment?.id === appointment.id) {
        setSelectedAppointment(response.data);
        setAppointmentPatchStatus(response.data.status);
        setAppointmentPatchReason(response.data.cancellationReason ?? '');
      }
      await loadAppointments(appointmentFilters);
      toast({ title: 'Appointment cancelled', status: 'success', duration: 2500, isClosable: true });
    } catch (error) {
      showError(error);
    }
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    const confirmed = window.confirm(`Delete appointment for ${appointment.customerName}?`);
    if (!confirmed) return;

    try {
      await api.deleteAppointment(appointment.id);
      if (selectedAppointment?.id === appointment.id) {
        setSelectedAppointment(null);
        appointmentDetailDisclosure.onClose();
      }
      await loadAppointments(appointmentFilters);
      toast({ title: 'Appointment deleted', status: 'success', duration: 2500, isClosable: true });
    } catch (error) {
      showError(error);
    }
  };

  const totalRevenue = useMemo(() => {
    return appointments.reduce((sum, appointment) => {
      const service = services.find((item) => item.id === appointment.serviceId);
      return sum + (service?.price ?? 0);
    }, 0);
  }, [appointments, services]);

  const activeServices = services.filter((service) => service.isActive).length;
  const todayAppointments = appointments.filter(
    (appointment) => appointment.appointmentDate === getTodayString(),
  ).length;
  const pendingAppointments = appointments.filter((appointment) => appointment.status === 'PENDING').length;
  const activeServiceOptions = services.filter((service) => service.isActive);

  return (
    <Box minH="100vh" bgGradient="linear(to-br, purple.50, blue.50)">
      <Box maxW="1440px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
        <Stack spacing={8}>
          <SectionCard
            title="Appointment Booking System Frontend"
            subtitle="Vite + React + Chakra UI demo ที่ครอบคลุมการเรียกใช้งานทุก endpoint สำคัญของระบบ"
            actions={
              <HStack spacing={3} align="stretch">
                <Input
                  value={apiBaseUrl}
                  onChange={(event) => setApiBaseUrl(event.target.value)}
                  maxW="340px"
                  bg="white"
                  placeholder="http://localhost:3000"
                />
                <Button colorScheme="purple" onClick={() => void refreshAll()}>
                  Refresh all
                </Button>
              </HStack>
            }
          >
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
              <StatCard label="Services" value={String(services.length)} help={`${activeServices} active`} />
              <StatCard label="Appointments" value={String(appointments.length)} help={`${pendingAppointments} pending`} />
              <StatCard label="Today" value={String(todayAppointments)} help="Appointments for today" />
              <StatCard label="Projected revenue" value={formatCurrency(totalRevenue)} help="Based on current appointments" />
            </SimpleGrid>
          </SectionCard>

          <SectionCard
            title="Project coverage"
            subtitle="หน้าเดียวนี้ออกแบบตามโครงสร้าง backend ที่ศึกษาไว้ ทั้ง services, appointments, filters, transitions และ standard ApiResponse"
          >
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
              <CoverageItem
                title="Services API"
                items={[
                  'GET /services with category and isActive filters',
                  'GET /services/:id details',
                  'POST /services create form',
                  'PUT and PATCH edit flows',
                  'DELETE with conflict handling',
                  'GET /services/:id/available-slots',
                ]}
              />
              <CoverageItem
                title="Appointments API"
                items={[
                  'GET /appointments with status, serviceId, date filters',
                  'GET /appointments/:id details',
                  'POST /appointments create form',
                  'PUT /appointments/:id edit form',
                  'PATCH /appointments/:id for status transitions',
                  'PATCH confirm and cancel shortcuts',
                ]}
              />
              <CoverageItem
                title="Developer visibility"
                items={[
                  'Live API activity log',
                  'Raw request/response payload preview',
                  'Runtime API base URL switcher',
                  'UI summaries mapped from business rules',
                ]}
              />
            </SimpleGrid>
          </SectionCard>

          <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 380px' }} gap={6} alignItems="start">
            <Tabs bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" overflow="hidden">
              <TabList px={4} pt={4}>
                <Tab>Services</Tab>
                <Tab>Appointments</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                <Stack spacing={6}>
                  <SectionCard
                    title="Service management"
                    subtitle="จัดการข้อมูลบริการ พร้อมทดสอบ list filters, CRUD, partial update และ available slots"
                    actions={
                      <HStack spacing={3}>
                        <Button variant="outline" onClick={() => setServiceFilters(DEFAULT_SERVICE_FILTERS)}>
                          Reset filters
                        </Button>
                        <Button colorScheme="purple" onClick={serviceCreateDisclosure.onOpen}>
                          New service
                        </Button>
                      </HStack>
                    }
                  >
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                      <FormControl>
                        <FormLabel>Category</FormLabel>
                        <Select
                          value={serviceFilters.category}
                          onChange={(event) =>
                            setServiceFilters((current) => ({
                              ...current,
                              category: event.target.value as ServiceFilters['category'],
                            }))
                          }
                        >
                          <option value="">All categories</option>
                          {SERVICE_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Status</FormLabel>
                        <Select
                          value={serviceFilters.isActive}
                          onChange={(event) =>
                            setServiceFilters((current) => ({
                              ...current,
                              isActive: event.target.value as ServiceFilters['isActive'],
                            }))
                          }
                        >
                          <option value="">All statuses</option>
                          <option value="true">Active only</option>
                          <option value="false">Inactive only</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Live status</FormLabel>
                        <Flex align="center" h="40px">
                          {isLoadingServices ? <Spinner size="sm" /> : <Text color="gray.600">{services.length} services loaded</Text>}
                        </Flex>
                      </FormControl>
                    </SimpleGrid>

                    <TableContainer borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                      <Table size="sm" variant="simple">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th>Name</Th>
                            <Th>Category</Th>
                            <Th>Provider</Th>
                            <Th isNumeric>Price</Th>
                            <Th>Availability</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {services.map((service) => (
                            <Tr key={service.id}>
                              <Td>
                                <Text fontWeight="semibold">{service.name}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {service.durationMinutes} mins · buffer {service.bufferMinutes} mins
                                </Text>
                              </Td>
                              <Td>{humanizeEnum(service.category)}</Td>
                              <Td>{service.providerName}</Td>
                              <Td isNumeric>{formatCurrency(service.price)}</Td>
                              <Td>{service.startTime} - {service.endTime}</Td>
                              <Td>
                                <Badge colorScheme={service.isActive ? 'green' : 'gray'}>
                                  {service.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </Td>
                              <Td>
                                <Flex gap={2} wrap="wrap">
                                  <Button size="xs" onClick={() => void openServiceDetails(service.id)}>
                                    Details
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedService(service);
                                      serviceEditDisclosure.onOpen();
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button size="xs" variant="outline" onClick={() => void handleQuickToggleService(service)}>
                                    Toggle
                                  </Button>
                                  <Button size="xs" colorScheme="red" variant="ghost" onClick={() => void handleDeleteService(service)}>
                                    Delete
                                  </Button>
                                </Flex>
                              </Td>
                            </Tr>
                          ))}
                          {!isLoadingServices && services.length === 0 ? (
                            <Tr>
                              <Td colSpan={7}>
                                <Text py={6} textAlign="center" color="gray.500">
                                  No services matched the current filters.
                                </Text>
                              </Td>
                            </Tr>
                          ) : null}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </SectionCard>
                </Stack>
                </TabPanel>

                <TabPanel>
                <Stack spacing={6}>
                  <SectionCard
                    title="Appointment management"
                    subtitle="ทดสอบ booking flow, filters, state transitions, confirm, cancel และ partial patch"
                    actions={
                      <HStack spacing={3}>
                        <Button variant="outline" onClick={() => setAppointmentFilters(DEFAULT_APPOINTMENT_FILTERS)}>
                          Reset filters
                        </Button>
                        <Button colorScheme="purple" onClick={appointmentCreateDisclosure.onOpen}>
                          New appointment
                        </Button>
                      </HStack>
                    }
                  >
                    <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={4}>
                      <FormControl>
                        <FormLabel>Status</FormLabel>
                        <Select
                          value={appointmentFilters.status}
                          onChange={(event) =>
                            setAppointmentFilters((current) => ({
                              ...current,
                              status: event.target.value as AppointmentFilters['status'],
                            }))
                          }
                        >
                          <option value="">All statuses</option>
                          {APPOINTMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Service</FormLabel>
                        <Select
                          value={appointmentFilters.serviceId}
                          onChange={(event) =>
                            setAppointmentFilters((current) => ({
                              ...current,
                              serviceId: event.target.value,
                            }))
                          }
                        >
                          <option value="">All services</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Date</FormLabel>
                        <Input
                          type="date"
                          value={appointmentFilters.date}
                          onChange={(event) =>
                            setAppointmentFilters((current) => ({
                              ...current,
                              date: event.target.value,
                            }))
                          }
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Live status</FormLabel>
                        <Flex align="center" h="40px">
                          {isLoadingAppointments ? (
                            <Spinner size="sm" />
                          ) : (
                            <Text color="gray.600">{appointments.length} appointments loaded</Text>
                          )}
                        </Flex>
                      </FormControl>
                    </SimpleGrid>

                    <TableContainer borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                      <Table size="sm" variant="simple">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th>Customer</Th>
                            <Th>Service</Th>
                            <Th>Date</Th>
                            <Th>Time</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {appointments.map((appointment) => (
                            <Tr key={appointment.id}>
                              <Td>
                                <Text fontWeight="semibold">{appointment.customerName}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {appointment.customerEmail}
                                </Text>
                              </Td>
                              <Td>{appointment.serviceName}</Td>
                              <Td>{appointment.appointmentDate}</Td>
                              <Td>{appointment.startTime} - {appointment.endTime}</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(appointment.status)}>
                                  {humanizeEnum(appointment.status)}
                                </Badge>
                              </Td>
                              <Td>
                                <Flex gap={2} wrap="wrap">
                                  <Button size="xs" onClick={() => void openAppointmentDetails(appointment.id)}>
                                    Details
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedAppointment(appointment);
                                      appointmentEditDisclosure.onOpen();
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => void handleConfirmAppointment(appointment)}
                                    isDisabled={appointment.status !== 'PENDING'}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => void handleCancelAppointment(appointment)}
                                    isDisabled={appointment.status === 'CANCELLED'}
                                  >
                                    Cancel
                                  </Button>
                                  <Button size="xs" colorScheme="red" variant="ghost" onClick={() => void handleDeleteAppointment(appointment)}>
                                    Delete
                                  </Button>
                                </Flex>
                              </Td>
                            </Tr>
                          ))}
                          {!isLoadingAppointments && appointments.length === 0 ? (
                            <Tr>
                              <Td colSpan={6}>
                                <Text py={6} textAlign="center" color="gray.500">
                                  No appointments matched the current filters.
                                </Text>
                              </Td>
                            </Tr>
                          ) : null}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </SectionCard>
                </Stack>
                </TabPanel>
              </TabPanels>
            </Tabs>

            <Stack spacing={6} position={{ base: 'static', xl: 'sticky' }} top={{ xl: '24px' }}>
              <SectionCard
                title="Recent API calls"
                subtitle="แสดงอยู่ด้านขวาตลอดเวลา เพื่อดูการใช้งาน API ระหว่างทำงานในทุกแท็บ"
                actions={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActivities([]);
                      setSelectedLog(null);
                    }}
                  >
                    Clear log
                  </Button>
                }
              >
                <Stack spacing={3} maxH={{ base: '360px', xl: '420px' }} overflowY="auto">
                  {activities.map((entry) => (
                    <Box
                      key={entry.id}
                      borderWidth="1px"
                      borderColor={selectedLog?.id === entry.id ? 'purple.300' : 'gray.200'}
                      borderRadius="xl"
                      p={4}
                      cursor="pointer"
                      onClick={() => setSelectedLog(entry)}
                      bg={selectedLog?.id === entry.id ? 'purple.50' : 'white'}
                    >
                      <Flex justify="space-between" align="center" gap={3}>
                        <Text fontWeight="semibold">{summarizeLog(entry)}</Text>
                        <Badge colorScheme={entry.ok ? 'green' : 'red'}>{entry.ok ? 'OK' : 'Error'}</Badge>
                      </Flex>
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        {formatDateTime(entry.timestamp)}
                      </Text>
                    </Box>
                  ))}
                  {activities.length === 0 ? (
                    <Text color="gray.500">Run an action from the Services or Appointments tabs to populate this log.</Text>
                  ) : null}
                </Stack>
              </SectionCard>
            </Stack>
          </Grid>

          <SectionCard
            title="Payload inspector"
            subtitle="แยกออกมาเป็นอีกส่วนสำหรับดู request และ response ล่าสุดแบบเต็มพื้นที่"
          >
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Request body
                </Text>
                <JsonPreview value={selectedLog?.requestBody} emptyText="This request had no body." />
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Response body
                </Text>
                <JsonPreview value={selectedLog?.responseBody} emptyText="No response selected yet." />
              </Box>
            </SimpleGrid>
          </SectionCard>
        </Stack>
      </Box>

      <ServiceFormModal
        isOpen={serviceCreateDisclosure.isOpen}
        mode="create"
        title="Create service"
        initialValues={DEFAULT_SERVICE_FORM}
        isSubmitting={isSubmitting}
        onClose={serviceCreateDisclosure.onClose}
        onCreate={handleCreateService}
      />

      <ServiceFormModal
        isOpen={serviceEditDisclosure.isOpen}
        mode="edit"
        title={selectedService ? `Edit service · ${selectedService.name}` : 'Edit service'}
        initialValues={selectedService ? mapServiceToFormValues(selectedService) : DEFAULT_SERVICE_FORM}
        isSubmitting={isSubmitting}
        onClose={serviceEditDisclosure.onClose}
        onUpdate={handleUpdateService}
        onPatch={handlePatchService}
      />

      <AppointmentFormModal
        isOpen={appointmentCreateDisclosure.isOpen}
        title="Create appointment"
        initialValues={{
          ...DEFAULT_APPOINTMENT_FORM,
          serviceId: activeServiceOptions[0]?.id ?? '',
          appointmentDate: getTodayString(),
        }}
        services={activeServiceOptions}
        isSubmitting={isSubmitting}
        submitLabel="Create appointment"
        onClose={appointmentCreateDisclosure.onClose}
        onSubmit={handleCreateAppointment}
      />

      <AppointmentFormModal
        isOpen={appointmentEditDisclosure.isOpen}
        title={selectedAppointment ? `Edit appointment · ${selectedAppointment.customerName}` : 'Edit appointment'}
        initialValues={selectedAppointment ? mapAppointmentToFormValues(selectedAppointment) : DEFAULT_APPOINTMENT_FORM}
        services={activeServiceOptions.length > 0 ? activeServiceOptions : services}
        isSubmitting={isSubmitting}
        submitLabel="Save with PUT"
        onClose={appointmentEditDisclosure.onClose}
        onSubmit={handleUpdateAppointment}
      />

      <Modal isOpen={serviceDetailDisclosure.isOpen} onClose={serviceDetailDisclosure.onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedService?.name ?? 'Service details'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedService ? (
              <Stack spacing={6}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <DetailItem label="Category" value={humanizeEnum(selectedService.category)} />
                  <DetailItem label="Provider" value={selectedService.providerName} />
                  <DetailItem label="Price" value={formatCurrency(selectedService.price)} />
                  <DetailItem label="Duration" value={`${selectedService.durationMinutes} minutes`} />
                  <DetailItem label="Operating hours" value={`${selectedService.startTime} - ${selectedService.endTime}`} />
                  <DetailItem label="Concurrent bookings" value={String(selectedService.maxConcurrentBookings)} />
                  <DetailItem label="Available days" value={selectedService.availableDays.map(humanizeEnum).join(', ')} />
                  <DetailItem label="Status" value={selectedService.isActive ? 'Active' : 'Inactive'} />
                </SimpleGrid>
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Description
                  </Text>
                  <Text color="gray.700">{selectedService.description}</Text>
                </Box>
                <Divider />
                <SectionCard
                  title="Available slots"
                  subtitle="เรียก GET /services/:id/available-slots ตาม business rule ของ backend"
                  bg="gray.50"
                >
                  <Stack spacing={4}>
                    <HStack align="end">
                      <FormControl maxW="240px">
                        <FormLabel>Date</FormLabel>
                        <Input
                          type="date"
                          value={serviceSlotsDate}
                          onChange={(event) => setServiceSlotsDate(event.target.value)}
                        />
                      </FormControl>
                      <Button colorScheme="purple" onClick={() => void handleLoadAvailableSlots()}>
                        Load slots
                      </Button>
                    </HStack>
                    <Flex gap={2} wrap="wrap">
                      {availableSlots.map((slot) => (
                        <Badge key={slot} px={3} py={2} borderRadius="full" colorScheme="purple">
                          {slot}
                        </Badge>
                      ))}
                      {availableSlots.length === 0 ? (
                        <Text color="gray.500">No slots loaded yet or there are no available slots on the selected date.</Text>
                      ) : null}
                    </Flex>
                  </Stack>
                </SectionCard>
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Raw entity payload
                  </Text>
                  <JsonPreview value={selectedService} />
                </Box>
              </Stack>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={serviceDetailDisclosure.onClose}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  serviceDetailDisclosure.onClose();
                  serviceEditDisclosure.onOpen();
                }}
                isDisabled={!selectedService}
              >
                Edit
              </Button>
              <Button
                colorScheme="red"
                variant="outline"
                onClick={() => selectedService && void handleDeleteService(selectedService)}
                isDisabled={!selectedService}
              >
                Delete
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={appointmentDetailDisclosure.isOpen} onClose={appointmentDetailDisclosure.onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedAppointment?.customerName ?? 'Appointment details'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedAppointment ? (
              <Stack spacing={6}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <DetailItem label="Customer" value={selectedAppointment.customerName} />
                  <DetailItem label="Service" value={selectedAppointment.serviceName} />
                  <DetailItem label="Email" value={selectedAppointment.customerEmail} />
                  <DetailItem label="Phone" value={selectedAppointment.customerPhone} />
                  <DetailItem label="Appointment date" value={selectedAppointment.appointmentDate} />
                  <DetailItem label="Time" value={`${selectedAppointment.startTime} - ${selectedAppointment.endTime}`} />
                  <DetailItem label="Status" value={humanizeEnum(selectedAppointment.status)} />
                  <DetailItem label="Created" value={formatDateTime(selectedAppointment.createdAt)} />
                </SimpleGrid>
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Notes
                  </Text>
                  <Text color="gray.700">{selectedAppointment.notes || '—'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Cancellation reason
                  </Text>
                  <Text color="gray.700">{selectedAppointment.cancellationReason || '—'}</Text>
                </Box>
                <Divider />
                <SectionCard
                  title="Status patch playground"
                  subtitle="ใช้ทดสอบ PATCH /appointments/:id รวมถึง state transition rules จาก backend"
                  bg="gray.50"
                >
                  <Stack spacing={4}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel>New status</FormLabel>
                        <Select
                          value={appointmentPatchStatus}
                          onChange={(event) => setAppointmentPatchStatus(event.target.value as AppointmentStatus)}
                        >
                          {APPOINTMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Cancellation reason</FormLabel>
                        <Textarea
                          value={appointmentPatchReason}
                          onChange={(event) => setAppointmentPatchReason(event.target.value)}
                          placeholder="Required when changing to CANCELLED"
                          rows={3}
                        />
                      </FormControl>
                    </SimpleGrid>
                    <HStack spacing={3}>
                      <Button variant="outline" onClick={() => void handlePatchAppointment()} isLoading={isSubmitting}>
                        Apply PATCH
                      </Button>
                      <Button
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => void handleConfirmAppointment(selectedAppointment)}
                        isDisabled={selectedAppointment.status !== 'PENDING'}
                      >
                        Confirm endpoint
                      </Button>
                      <Button
                        colorScheme="orange"
                        variant="outline"
                        onClick={() => void handleCancelAppointment(selectedAppointment)}
                        isDisabled={selectedAppointment.status === 'CANCELLED'}
                      >
                        Cancel endpoint
                      </Button>
                    </HStack>
                  </Stack>
                </SectionCard>
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Raw entity payload
                  </Text>
                  <JsonPreview value={selectedAppointment} />
                </Box>
              </Stack>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={appointmentDetailDisclosure.onClose}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  appointmentDetailDisclosure.onClose();
                  appointmentEditDisclosure.onOpen();
                }}
                isDisabled={!selectedAppointment}
              >
                Edit
              </Button>
              <Button
                colorScheme="red"
                variant="outline"
                onClick={() => selectedAppointment && void handleDeleteAppointment(selectedAppointment)}
                isDisabled={!selectedAppointment}
              >
                Delete
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

function StatCard({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="2xl" p={5} bg="white">
      <Stat>
        <StatLabel color="gray.500">{label}</StatLabel>
        <StatNumber>{value}</StatNumber>
        <StatHelpText mb={0}>{help}</StatHelpText>
      </Stat>
    </Box>
  );
}

function CoverageItem({ title, items }: { title: string; items: string[] }) {
  return (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="2xl" p={5} bg="white">
      <Text fontWeight="bold" mb={3}>
        {title}
      </Text>
      <Stack spacing={2}>
        {items.map((item) => (
          <Text key={item} color="gray.600">
            • {item}
          </Text>
        ))}
      </Stack>
    </Box>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={4} bg="white">
      <Text fontSize="sm" color="gray.500" mb={1}>
        {label}
      </Text>
      <Text fontWeight="semibold">{value}</Text>
    </Box>
  );
}

function mapServiceToFormValues(service: Service): ServiceFormValues {
  return {
    name: service.name,
    description: service.description,
    category: service.category,
    durationMinutes: service.durationMinutes,
    price: service.price,
    providerName: service.providerName,
    availableDays: service.availableDays,
    startTime: service.startTime,
    endTime: service.endTime,
    maxConcurrentBookings: service.maxConcurrentBookings,
    bufferMinutes: service.bufferMinutes,
    isActive: service.isActive,
  };
}

function mapAppointmentToFormValues(appointment: Appointment): AppointmentFormValues {
  return {
    serviceId: appointment.serviceId,
    customerName: appointment.customerName,
    customerEmail: appointment.customerEmail,
    customerPhone: appointment.customerPhone,
    appointmentDate: appointment.appointmentDate,
    startTime: appointment.startTime,
    notes: appointment.notes,
  };
}

function getTodayString(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}
