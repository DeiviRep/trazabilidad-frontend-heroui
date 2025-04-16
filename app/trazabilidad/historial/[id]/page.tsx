"use client";

import React, { useEffect, useRef } from "react";
import axios from "axios";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import L from "leaflet"; // Importamos Leaflet

export default function Historial({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const URL_BACKEND_PROD = process.env.NEXT_PUBLIC_BACKEND_URL_PROD;
  const URL_BACKEND_DEV = process.env.NEXT_PUBLIC_BACKEND_URL_DEV;
  const IS_PROD = process.env.NEXT_PUBLIC_IS_PROD === "true";
  const BASE_URL = IS_PROD ? URL_BACKEND_PROD : URL_BACKEND_DEV;

  const params = React.use(paramsPromise);
  const [historial, setHistorial] = React.useState<any[]>([]);
  const [qrUrl, setQrUrl] = React.useState<string>("");
  const mapRef = useRef<L.Map | null>(null); // Referencia al mapa
  const mapContainerRef = useRef<HTMLDivElement>(null); // Referencia al contenedor del mapa

  const fetchHistorial = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/trazabilidad/historial/${params.id}`,
      );

      setHistorial(response.data);
      const qrResponse = await axios.get(
        `${BASE_URL}/trazabilidad/qr/${params.id}`,
      );

      setQrUrl(qrResponse.data.qrUrl);

      // Inicializar el mapa con todas las ubicaciones
      if (response.data.length > 0 && mapContainerRef.current) {
        const ubicaciones = response.data.map((entrada: any) => {
          const [lat, lng] = entrada.ubicacion.split(",").map(parseFloat);

          return [lat, lng] as [number, number];
        });

        // Inicializar el mapa si no existe
        if (!mapRef.current) {
          mapRef.current = L.map(mapContainerRef.current).setView(
            ubicaciones[0],
            13,
          );
          L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(mapRef.current);
        }

        // Limpiar marcadores y polilíneas previos
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            mapRef.current?.removeLayer(layer);
          }
        });

        // Agregar marcadores
        response.data.forEach((entrada: any, index: number) => {
          const [lat, lng] = entrada.ubicacion.split(",").map(parseFloat);

          L.marker([lat, lng])
            .addTo(mapRef.current!)
            .bindPopup(
              `<b>${params.id}</b><br>Evento: ${entrada.evento}<br>Fecha: ${entrada.timestamp}`,
            );
        });

        // Agregar polilínea para conectar ubicaciones
        L.polyline(ubicaciones, { color: "blue" }).addTo(mapRef.current!);

        // Ajustar el mapa para mostrar todas las ubicaciones
        if (ubicaciones.length > 1) {
          const bounds = L.latLngBounds(ubicaciones);

          mapRef.current.fitBounds(bounds);
        }
      }
    } catch (error) {
      console.error("Error al consultar historial:", error);
    }
  };

  useEffect(() => {
    fetchHistorial();

    return () => {
      // Limpiar el mapa al desmontar
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [params.id]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <h1 className="text-3xl font-bold mb-6">Historial de {params.id}</h1>
      <Card>
        <CardHeader>Historial Completo</CardHeader>
        <CardBody>
          {historial.length > 0 ? (
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
                    download={`qr-${params.id}.png`}
                    href={qrUrl}
                  >
                    Descargar QR
                  </a>
                </div>
              )}
              {/* Mapa */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold">
                  Recorrido del Dispositivo
                </h3>
                <div
                  ref={mapContainerRef}
                  id="map-historial"
                  style={{ height: "400px", width: "100%" }}
                />
              </div>
            </>
          ) : (
            <p>No se encontró historial para este dispositivo.</p>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
