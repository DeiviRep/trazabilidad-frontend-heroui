/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable no-console */
"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Alert } from "@heroui/alert";
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import axios from "axios";

export default function Home() {
  const URL_BACKEND_PROD = process.env.NEXT_PUBLIC_BACKEND_URL_PROD;
  const URL_BACKEND_DEV = process.env.NEXT_PUBLIC_BACKEND_URL_DEV;
  const IS_PROD = process.env.NEXT_PUBLIC_IS_PROD === "true";
  const BASE_URL = IS_PROD ? URL_BACKEND_PROD : URL_BACKEND_DEV;

  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [id, setId] = useState("");
  const [modelo, setModelo] = useState("");
  const [marca, setMarca] = useState("");
  const [origen, setOrigen] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [evento, setEvento] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [geoError, setGeoError] = useState<string>("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [alertColor, setAlertColor] = useState<
    | "success"
    | "danger"
    | "warning"
    | "default"
    | "primary"
    | "secondary"
    | undefined
  >("success");
  const [tooltipStates, setTooltipStates] = useState<{
    [key: string]: boolean;
  }>({});

  const mapRefs = useRef<{ [key: string]: L.Map | null }>({});

  const eventos = [
    { key: "Salida", label: "Salida" },
    { key: "Recepción", label: "Recepción" },
    { key: "Entrega", label: "Entrega" },
  ];

  const showAlert = (
    title: string,
    description: string,
    color:
      | "success"
      | "danger"
      | "warning"
      | "default"
      | "primary"
      | "secondary"
      | undefined = "success",
  ) => {
    setAlertTitle(title);
    setAlertDescription(description);
    setAlertColor(color);
    setAlertVisible(true);
  };

  const listarDispositivos = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/trazabilidad/listar`);

      setDispositivos(response.data);
    } catch (error) {
      console.log("Error al listar dispositivos:", error);
    }
  };

  const registrarDispositivo = async () => {
    try {
      await axios.post(`${BASE_URL}/trazabilidad/registrar`, {
        id,
        modelo,
        marca,
        origen,
        latitud,
        longitud,
        evento,
      });
      showAlert(
        "Registro exitoso",
        "El dispositivo fue registrado correctamente.",
        "success",
      );
      listarDispositivos();
      clearForm();
      setIsCreateModalOpen(false);
    } catch (error) {
      showAlert("Error", "No se pudo registrar el dispositivo.", "danger");
      console.log("Error al registrar dispositivo:", error);
    }
  };

  const registrarNuevoEvento = async () => {
    if (!selectedDevice) return;
    try {
      await axios.post(`${BASE_URL}/trazabilidad/actualizar`, {
        id: selectedDevice.id,
        modelo: selectedDevice.modelo,
        marca: selectedDevice.marca,
        origen: selectedDevice.origen,
        latitud: selectedDevice.latitud,
        longitud: selectedDevice.longitud,
        evento: selectedDevice.evento,
      });
      showAlert(
        "Evento registrado",
        "El nuevo evento fue guardado.",
        "success",
      );
      listarDispositivos();
      setIsNewEventModalOpen(false);
      setSelectedDevice(null);
    } catch (error) {
      showAlert("Error", "No se pudo registrar el evento.", "danger");
      console.log("Error al registrar nuevo evento:", error);
    }
  };

  const openQrModal = async (deviceId: string) => {
    try {
      const qrResponse = await axios.get(
        `${BASE_URL}/trazabilidad/qr/${deviceId}`,
      );

      setQrUrl(qrResponse.data.qrUrl);
      setIsQrModalOpen(true);
    } catch (error) {
      console.log("Error al obtener QR:", error);
      showAlert("Error", "No se pudo obtener el código QR.", "danger");
    }
  };

  const getGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitud(position.coords.latitude.toFixed(4));
          setLongitud(position.coords.longitude.toFixed(4));
          if (selectedDevice) {
            setSelectedDevice({
              ...selectedDevice,
              latitud: position.coords.latitude.toFixed(4),
              longitud: position.coords.longitude.toFixed(4),
            });
          }
          setGeoError("");
        },
        (error) => {
          setGeoError("No se pudo obtener la ubicación: " + error.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    } else {
      setGeoError("Geolocalización no soportada por este navegador.");
    }
  };

  const clearForm = () => {
    setId("");
    setModelo("");
    setMarca("");
    setOrigen("");
    setLatitud("");
    setLongitud("");
    setEvento("");
    setQrUrl("");
    setGeoError("");
  };

  const openNewEventModal = (dispositivo: any) => {
    setSelectedDevice({
      ...dispositivo,
      latitud: "",
      longitud: "",
      evento: "",
    });
    setIsNewEventModalOpen(true);
  };

  const handleModalClose = () => {
    setIsNewEventModalOpen(false);
    setIsCreateModalOpen(false);
    setIsQrModalOpen(false);
    setSelectedDevice(null);
    setGeoError("");
    setQrUrl("");
    clearForm();
  };

  const initializeMap = async (deviceId: string, lat: number, lng: number) => {
    if (!mapRefs.current[deviceId]) {
      const mapContainer = document.getElementById(`map-${deviceId}`);

      if (mapContainer) {
        const L = await import("leaflet");
        const map = L.map(mapContainer).setView([lat, lng], 13);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`<b>${deviceId}</b>`)
          .openPopup();
        mapRefs.current[deviceId] = map;
      }
    }
  };

  const cleanupMap = (deviceId: string) => {
    if (mapRefs.current[deviceId]) {
      mapRefs.current[deviceId]?.remove();
      mapRefs.current[deviceId] = null;
    }
  };

  useEffect(() => {
    listarDispositivos();
  }, []);

  useEffect(() => {
    Object.entries(tooltipStates).forEach(([deviceId, isOpen]) => {
      const dispositivo = dispositivos.find((d) => d.id === deviceId);

      if (!dispositivo) return;
      const [lat, lng] = dispositivo.ubicacion
        .split(",")
        .map((coord: string) => parseFloat(coord.trim()));

      if (isOpen && !isNaN(lat) && !isNaN(lng)) {
        initializeMap(deviceId, lat, lng);
      } else if (!isOpen && mapRefs.current[deviceId]) {
        cleanupMap(deviceId);
      }
    });
  }, [tooltipStates, dispositivos]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <h1 className="text-3xl font-bold mb-6">Trazabilidad de Dispositivos</h1>
      {alertVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAlertVisible(false);
          }}
        >
          <Alert
            className="w-[90%] max-w-md"
            color={alertColor}
            description={alertDescription}
            isVisible={alertVisible}
            title={alertTitle}
            variant="faded"
            onClose={() => setAlertVisible(false)}
          />
        </div>
      )}

      <Card className="mb-6 w-full">
        <Button
          color="primary"
          variant="shadow"
          onPress={() => setIsCreateModalOpen(true)}
        >
          Crear Dispositivo
        </Button>
        <CardHeader>Lista de Dispositivos</CardHeader>
        <Table
          aria-label="Tabla de dispositivos"
          className="min-w-[600px]"
          color="default"
        >
          <TableHeader>
            <TableColumn>ID</TableColumn>
            <TableColumn>Modelo</TableColumn>
            <TableColumn>Marca</TableColumn>
            <TableColumn>Ubicación</TableColumn>
            <TableColumn>Evento</TableColumn>
            <TableColumn>Timestamp</TableColumn>
            <TableColumn>Acciones</TableColumn>
          </TableHeader>
          <TableBody>
            {dispositivos.map((dispositivo, index) => {
              const deviceId = dispositivo.id;
              const handleOpenChange = (open: boolean) => {
                setTooltipStates((prev) => ({ ...prev, [deviceId]: open }));
              };

              return (
                <TableRow key={index}>
                  <TableCell>{dispositivo.id}</TableCell>
                  <TableCell>{dispositivo.modelo}</TableCell>
                  <TableCell>{dispositivo.marca}</TableCell>
                  <TableCell>
                    <Tooltip
                      content={
                        <div
                          className="w-[340px] h-[240px]"
                          style={{ position: "relative" }}
                        >
                          <div
                            id={`map-${deviceId}`}
                            style={{ width: "100%", height: "100%" }}
                          />
                        </div>
                      }
                      placement="bottom"
                      onOpenChange={handleOpenChange}
                    >
                      <Chip color="primary" size="sm" variant="flat">
                        {dispositivo.ubicacion}
                      </Chip>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{dispositivo.evento}</TableCell>
                  <TableCell>{dispositivo.timestamp}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        color="success"
                        size="sm"
                        onPress={() => openNewEventModal(dispositivo)}
                      >
                        Nuevo Evento
                      </Button>
                      <a
                        href={`/trazabilidad/historial/${dispositivo.id}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Button color="secondary" size="sm">
                          Ver Historial
                        </Button>
                      </a>
                      <Button
                        color="primary"
                        size="sm"
                        onPress={() => openQrModal(dispositivo.id)}
                      >
                        Ver QR
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Aquí continúan tus modales (Crear, Nuevo Evento, Ver QR) */}
      {/* Todo igual que antes */}

      <Modal isOpen={isCreateModalOpen} onClose={handleModalClose}>
        <ModalContent>
          <ModalHeader>Crear Dispositivo</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="ID"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
              <Input
                placeholder="Modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
              />
              <Input
                placeholder="Marca"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
              />
              <Input
                placeholder="Origen"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Latitud"
                  value={latitud}
                  onChange={(e) => setLatitud(e.target.value)}
                />
                <Input
                  placeholder="Longitud"
                  value={longitud}
                  onChange={(e) => setLongitud(e.target.value)}
                />
                <Button color="secondary" onPress={getGeolocation}>
                  Obtener Ubicación
                </Button>
              </div>
              {geoError && <p className="text-red-500">{geoError}</p>}
              <Select
                className="max-w-xs"
                label="Evento"
                selectedKeys={evento ? [evento] : []}
                onSelectionChange={(keys) =>
                  setEvento(Array.from(keys)[0] as string)
                }
              >
                {eventos.map((evento) => (
                  <SelectItem key={evento.key}>{evento.label}</SelectItem>
                ))}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleModalClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={registrarDispositivo}>
              Registrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isNewEventModalOpen} onClose={handleModalClose}>
        <ModalContent>
          <ModalHeader>Nuevo Registro de Evento</ModalHeader>
          <ModalBody>
            {selectedDevice && (
              <div className="flex flex-col gap-4">
                <Input isDisabled label="ID" value={selectedDevice.id} />
                <Input
                  isDisabled
                  label="Modelo"
                  value={selectedDevice.modelo}
                />
                <Input isDisabled label="Marca" value={selectedDevice.marca} />
                <Input
                  isDisabled
                  label="Origen"
                  value={selectedDevice.origen}
                />
                <div className="flex gap-2">
                  <Input
                    label="Latitud"
                    value={selectedDevice.latitud}
                    onChange={(e) =>
                      setSelectedDevice({
                        ...selectedDevice,
                        latitud: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Longitud"
                    value={selectedDevice.longitud}
                    onChange={(e) =>
                      setSelectedDevice({
                        ...selectedDevice,
                        longitud: e.target.value,
                      })
                    }
                  />
                  <Button color="secondary" onPress={getGeolocation}>
                    Obtener Ubicación
                  </Button>
                </div>
                {geoError && <p className="text-red-500">{geoError}</p>}
                <Select
                  className="max-w-xs"
                  label="Evento"
                  selectedKeys={
                    selectedDevice.evento ? [selectedDevice.evento] : []
                  }
                  onSelectionChange={(keys) =>
                    setSelectedDevice({
                      ...selectedDevice,
                      evento: Array.from(keys)[0] as string,
                    })
                  }
                >
                  {eventos.map((evento) => (
                    <SelectItem key={evento.key}>{evento.label}</SelectItem>
                  ))}
                </Select>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleModalClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={registrarNuevoEvento}>
              Registrar Evento
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isQrModalOpen} onClose={handleModalClose}>
        <ModalContent>
          <ModalHeader>Código QR del Dispositivo</ModalHeader>
          <ModalBody>
            {qrUrl && (
              <div className="flex flex-col items-center gap-4">
                <img alt="QR Code" className="w-48 h-48" src={qrUrl} />
                <a
                  className="text-blue-500 underline"
                  download={`qr-${selectedDevice?.id || "device"}.png`}
                  href={qrUrl}
                >
                  <Button color="primary" size="sm">
                    Descargar QR
                  </Button>
                </a>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleModalClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}

export const dynamic = "force-dynamic";
