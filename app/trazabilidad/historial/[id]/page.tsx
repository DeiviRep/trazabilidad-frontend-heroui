/* eslint-disable no-console */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect } from "react";
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

export default function Historial({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const URL_BACKEND_PROD = process.env.NEXT_PUBLIC_BACKEND_URL_PROD;
  const URL_BACKEND_DEV = process.env.NEXT_PUBLIC_BACKEND_URL_DEV;
  const IS_PROD = process.env.NEXT_PUBLIC_IS_PROD === "true";
  const BASE_URL = IS_PROD ? URL_BACKEND_PROD : URL_BACKEND_DEV;

  // Desempaquetar params con React.use()
  const params = React.use(paramsPromise);
  const [historial, setHistorial] = React.useState<any[]>([]);
  const [qrUrl, setQrUrl] = React.useState<string>("");

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
    } catch (error) {
      console.error("Error al consultar historial:", error);
    }
  };

  useEffect(() => {
    fetchHistorial();
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
            </>
          ) : (
            <p>No se encontró historial para este dispositivo.</p>
          )}
        </CardBody>
      </Card>
    </section>
  );
}
