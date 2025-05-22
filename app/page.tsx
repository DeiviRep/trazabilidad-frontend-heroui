/* eslint-disable no-console */
"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Alert } from "@heroui/alert";
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
import L from "leaflet";

export default function Home() {
  const URL_BACKEND_PROD = process.env.NEXT_PUBLIC_BACKEND_URL_PROD;
  const URL_BACKEND_DEV = process.env.NEXT_PUBLIC_BACKEND_URL_DEV;
  const IS_PROD = process.env.NEXT_PUBLIC_IS_PROD === "true";
  const BASE_URL = IS_PROD ? URL_BACKEND_PROD : URL_BACKEND_DEV;

  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [id, setId] = useState("");
  const [modelo, setModelo] = useState("");
  const [marca, setMarca] = useState("");
  const [origen, setOrigen] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [evento, setEvento] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false); // Nuevo modal para eventos
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

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
    } catch (error) {
      showAlert("Error", "No se pudo registrar el dispositivo.", "danger");
      console.log("Error al registrar dispositivo:", error);
    }
  };

  const actualizarDispositivo = async () => {
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
        "Actualización exitosa",
        "El dispositivo fue actualizado.",
        "success",
      );
      listarDispositivos();
      setIsModalOpen(false);
      setSelectedDevice(null);
    } catch (error) {
      showAlert("Error", "No se pudo actualizar el dispositivo.", "danger");
      console.log("Error al actualizar dispositivo:", error);
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

  const consultarHistorial = async (deviceId: string) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/trazabilidad/historial/${deviceId}`,
      );

      setHistorial(response.data);
      const qrResponse = await axios.get(
        `${BASE_URL}/trazabilidad/qr/${deviceId}`,
      );

      setQrUrl(qrResponse.data.qrUrl);

      if (response.data.length > 0) {
        const ultimaUbicacion = response.data[response.data.length - 1];
        const lat = parseFloat(ultimaUbicacion.ubicacion.split(",")[0]);
        const lng = parseFloat(ultimaUbicacion.ubicacion.split(",")[1]);

        if (mapContainerRef.current) {
          if (!mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView(
              [lat, lng],
              13,
            );
            L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution:
                '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(mapRef.current);
          } else {
            mapRef.current.setView([lat, lng], 13);
          }

          mapRef.current.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
              mapRef.current?.removeLayer(layer);
            }
          });

          L.marker([lat, lng])
            .addTo(mapRef.current!)
            .bindPopup(
              `<b>${deviceId}</b><br>Evento: ${ultimaUbicacion.evento}<br>Fecha: ${ultimaUbicacion.timestamp}`,
            )
            .openPopup();
        }
      }
    } catch (error) {
      console.log("Error al consultar historial:", error);
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

  const openEditModal = (dispositivo: any) => {
    setSelectedDevice({
      ...dispositivo,
      latitud: dispositivo.ubicacion.split(",")[0],
      longitud: dispositivo.ubicacion.split(",")[1],
    });
    setIsModalOpen(true);
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
    setIsModalOpen(false);
    setIsNewEventModalOpen(false);
    setSelectedDevice(null);
    setGeoError("");
  };

  useEffect(() => {
    listarDispositivos();
    consultarHistorial("Cell001");

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <h1 className="text-3xl font-bold mb-6">Trazabilidad de Dispositivos</h1>
      {alertVisible && (
        <Alert
          color={alertColor}
          description={alertDescription}
          isVisible={alertVisible}
          title={alertTitle}
          variant="faded"
          onClose={() => setAlertVisible(false)}
        />
      )}

      {/* Formulario de Registro */}
      <Card className="mb-6 w-full max-w-2xl">
        <CardHeader>Registrar Dispositivo</CardHeader>
        <CardBody>
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

            <Button color="primary" onPress={registrarDispositivo}>
              Registrar
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Dispositivos */}
      <Card className="mb-6 w-full">
        <CardHeader>Lista de Dispositivos</CardHeader>
        <Table
          aria-label="Tabla de dispositivos"
          className="min-w-[600px]"
          color="default"
          defaultSelectedKeys={["0"]}
          selectionMode="single"
        >
          <TableHeader>
            <TableColumn className="w-1/6">ID</TableColumn>
            <TableColumn className="w-1/6">Modelo</TableColumn>
            <TableColumn className="w-1/6">Marca</TableColumn>
            <TableColumn className="w-1/6">Ubicación</TableColumn>
            <TableColumn className="w-1/6">Evento</TableColumn>
            <TableColumn className="w-1/6">Timestamp</TableColumn>
            <TableColumn className="w-1/6">Acciones</TableColumn>
          </TableHeader>
          <TableBody>
            {dispositivos.map((dispositivo, index) => (
              <TableRow
                key={index}
                onClick={() => consultarHistorial(dispositivo.id)}
              >
                <TableCell className="truncate max-w-[100px]">
                  {dispositivo.id}
                </TableCell>
                <TableCell className="truncate max-w-[100px]">
                  {dispositivo.modelo}
                </TableCell>
                <TableCell className="truncate max-w-[100px]">
                  {dispositivo.marca}
                </TableCell>
                <TableCell className="truncate max-w-[100px]">
                  {dispositivo.ubicacion}
                </TableCell>
                <TableCell className="truncate max-w-[100px]">
                  {dispositivo.evento}
                </TableCell>
                <TableCell className="truncate max-w-[100px]">
                  {dispositivo.timestamp}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      color="warning"
                      size="sm"
                      onPress={() => openEditModal(dispositivo)}
                    >
                      Editar
                    </Button>
                    <Button
                      color="success"
                      size="sm"
                      onPress={() => openNewEventModal(dispositivo)}
                    >
                      Nuevo Evento
                    </Button>
                    <Button
                      color="secondary"
                      size="sm"
                      onPress={() => consultarHistorial(dispositivo.id)}
                    >
                      Ver Historial
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Historial, QR y Mapa */}
      <Card className="w-full">
        <CardHeader>Historial del Dispositivo</CardHeader>
        <CardBody>
          <div className="flex flex-col gap-4">
            {historial.length > 0 && (
              <>
                <a
                  href={`/trazabilidad/historial/${historial[0].id}`}
                  rel="noopener noreferrer"
                  style={{
                    marginRight: "auto",
                  }}
                  target="_blank"
                >
                  <Button color="primary">Ver historial completo</Button>
                </a>

                <Table aria-label="Tabla de historial">
                  <TableHeader>
                    <TableColumn>Timestamp</TableColumn>
                    <TableColumn>Modelo</TableColumn>
                    <TableColumn>Marca</TableColumn>
                    <TableColumn>Ubicación</TableColumn>
                    <TableColumn>Evento</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {historial.map((entrada, index) => (
                      <TableRow key={index}>
                        <TableCell>{entrada.timestamp}</TableCell>
                        <TableCell>{entrada.modelo}</TableCell>
                        <TableCell>{entrada.marca}</TableCell>
                        <TableCell>{entrada.ubicacion}</TableCell>
                        <TableCell>{entrada.evento}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {qrUrl && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">Código QR</h3>
                    <img alt="QR Code" className="w-48 h-48" src={qrUrl} />
                    <a
                      className="text-blue-500 underline"
                      download={`qr-${historial[0].id}.png`}
                      href={qrUrl}
                    >
                      Descargar QR
                    </a>
                  </div>
                )}
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">Ubicación Actual</h3>
                  <div
                    ref={mapContainerRef}
                    id="map"
                    style={{ height: "400px", width: "100%" }}
                  />
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Modal de Edición */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <ModalContent>
          <ModalHeader>Editar Dispositivo</ModalHeader>
          <ModalBody>
            {selectedDevice && (
              <div className="flex flex-col gap-4">
                <Input isDisabled label="ID" value={selectedDevice.id} />
                <Input
                  label="Modelo"
                  value={selectedDevice.modelo}
                  onChange={(e) =>
                    setSelectedDevice({
                      ...selectedDevice,
                      modelo: e.target.value,
                    })
                  }
                />
                <Input
                  label="Marca"
                  value={selectedDevice.marca}
                  onChange={(e) =>
                    setSelectedDevice({
                      ...selectedDevice,
                      marca: e.target.value,
                    })
                  }
                />
                <Input
                  label="Origen"
                  value={selectedDevice.origen}
                  onChange={(e) =>
                    setSelectedDevice({
                      ...selectedDevice,
                      origen: e.target.value,
                    })
                  }
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
            <Button color="primary" onPress={actualizarDispositivo}>
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Nuevo Evento */}
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
    </section>
  );
}
