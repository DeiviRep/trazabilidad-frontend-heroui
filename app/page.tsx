/* eslint-disable no-console */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
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
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [geoError, setGeoError] = useState<string>(""); // Para errores de geolocalización

  const listarDispositivos = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/trazabilidad/listar`);

      setDispositivos(response.data);
    } catch (error) {
      console.error("Error al listar dispositivos:", error);
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
      listarDispositivos();
      clearForm();
    } catch (error) {
      console.error("Error al registrar dispositivo:", error);
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
        latitud:
          selectedDevice.latitud || selectedDevice.ubicacion.split(",")[0],
        longitud:
          selectedDevice.longitud || selectedDevice.ubicacion.split(",")[1],
        evento: selectedDevice.evento,
      });
      listarDispositivos();
      setIsModalOpen(false);
      setSelectedDevice(null);
    } catch (error) {
      console.error("Error al actualizar dispositivo:", error);
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
    } catch (error) {
      console.error("Error al consultar historial:", error);
    }
  };

  const getGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitud(position.coords.latitude.toFixed(4));
          setLongitud(position.coords.longitude.toFixed(4));
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

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
    setGeoError("");
  };

  useEffect(() => {
    listarDispositivos();
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <h1 className="text-3xl font-bold mb-6">Trazabilidad de Dispositivos</h1>

      {/* Formulario de Registro */}
      <Card className="mb-6">
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
            <Input
              placeholder="Evento (Salida/Recepción/Entrega)"
              value={evento}
              onChange={(e) => setEvento(e.target.value)}
            />
            <Button color="primary" onPress={registrarDispositivo}>
              Registrar
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Dispositivos */}
      <Card className="mb-6">
        <CardHeader>Lista de Dispositivos</CardHeader>
        <CardBody>
          <Table aria-label="Tabla de dispositivos">
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
              {dispositivos.map((dispositivo) => (
                <TableRow key={dispositivo.id}>
                  <TableCell>{dispositivo.id}</TableCell>
                  <TableCell>{dispositivo.modelo}</TableCell>
                  <TableCell>{dispositivo.marca}</TableCell>
                  <TableCell>{dispositivo.ubicacion}</TableCell>
                  <TableCell>{dispositivo.evento}</TableCell>
                  <TableCell>{dispositivo.timestamp}</TableCell>
                  <TableCell>
                    <Button
                      color="warning"
                      size="sm"
                      onPress={() => openEditModal(dispositivo)}
                    >
                      Editar
                    </Button>
                    <Button
                      className="ml-2"
                      color="secondary"
                      size="sm"
                      onPress={() => consultarHistorial(dispositivo.id)}
                    >
                      Ver Historial
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Historial y QR */}
      <Card>
        <CardHeader>Historial del Dispositivo</CardHeader>
        <CardBody>
          <div className="flex flex-col gap-4">
            {historial.length > 0 && (
              <>
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
                <Input
                  label="Evento"
                  value={selectedDevice.evento}
                  onChange={(e) =>
                    setSelectedDevice({
                      ...selectedDevice,
                      evento: e.target.value,
                    })
                  }
                />
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
    </section>
  );
}
