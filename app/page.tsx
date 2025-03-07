"use client";

import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";
import axios from "axios";
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

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

export default function Home() {
  const URL_BACKEND_PROD = "https://trazabilidad-backend-nestjs.onrender.com";
  const URL_BACKEND_DEV = "http://localhost:3000";
  const IS_PROD = process.env.NEXT_PUBLIC_IS_PROD === "true";
  const BASE_URL = IS_PROD ? URL_BACKEND_PROD : URL_BACKEND_DEV;
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [id, setId] = useState("");
  const [modelo, setModelo] = useState("");
  const [marca, setMarca] = useState("");
  const [caracteristica, setCaracteristica] = useState("");
  const [origen, setOrigen] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const listarDispositivos = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/trazabilidad/listar`);

      setDispositivos(response.data); // Usar directamente response.data
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
        caracteristica,
        origen,
      });
      listarDispositivos();
      clearForm();
    } catch (error) {
      console.error("Error al registrar dispositivo:", error);
    }
  };

  const consultarHistorial = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/trazabilidad/historial/${id}`,
      );

      setHistorial(response.data); // Usar directamente response.data
    } catch (error) {
      console.error("Error al consultar historial:", error);
    }
  };

  const consultarPorRango = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/trazabilidad/rango/${id}/${startDate}/${endDate}`,
      );

      setHistorial(response.data); // Usar directamente response.data
    } catch (error) {
      console.error("Error al consultar por rango:", error);
    }
  };

  const clearForm = () => {
    setId("");
    setModelo("");
    setMarca("");
    setCaracteristica("");
    setOrigen("");
    setStartDate("");
    setEndDate("");
  };

  useEffect(() => {
    listarDispositivos();
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <h1 className="text-3xl font-bold mb-6">Trazabilidad de Dispositivos</h1>
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
              placeholder="Característica"
              value={caracteristica}
              onChange={(e) => setCaracteristica(e.target.value)}
            />
            <Input
              placeholder="Origen"
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
            />
            <Button color="primary" onPress={registrarDispositivo}>
              Registrar
            </Button>
          </div>
        </CardBody>
      </Card>
      <Card className="mb-6">
        <CardHeader>Lista de Dispositivos</CardHeader>
        <CardBody>
          <Table aria-label="Tabla de dispositivos">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Modelo</TableColumn>
              <TableColumn>Marca</TableColumn>
              <TableColumn>Característica</TableColumn>
              <TableColumn>Origen</TableColumn>
              <TableColumn>Timestamp</TableColumn>
            </TableHeader>
            <TableBody>
              {dispositivos.map((dispositivo) => (
                <TableRow key={dispositivo.id}>
                  <TableCell>{dispositivo.id}</TableCell>
                  <TableCell>{dispositivo.modelo}</TableCell>
                  <TableCell>{dispositivo.marca}</TableCell>
                  <TableCell>{dispositivo.caracteristica}</TableCell>
                  <TableCell>{dispositivo.origen}</TableCell>
                  <TableCell>{dispositivo.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>Consultar Historial</CardHeader>
        <CardBody>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="ID"
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
            <Button color="secondary" onPress={consultarHistorial}>
              Consultar Historial
            </Button>
            <Input
              placeholder="Fecha Inicio (ISO)"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              placeholder="Fecha Fin (ISO)"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button color="success" onPress={consultarPorRango}>
              Consultar por Rango
            </Button>
            <Table aria-label="Tabla de historial">
              <TableHeader>
                <TableColumn>Timestamp</TableColumn>
                <TableColumn>Modelo</TableColumn>
                <TableColumn>Característica</TableColumn>
                <TableColumn>Origen</TableColumn>
              </TableHeader>
              <TableBody>
                {historial.map((entrada, index) => (
                  <TableRow key={index}>
                    <TableCell>{entrada.timestamp}</TableCell>
                    <TableCell>{entrada.modelo}</TableCell>
                    <TableCell>{entrada.caracteristica}</TableCell>
                    <TableCell>{entrada.origen}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Make&nbsp;</span>
        <span className={title({ color: "violet" })}>beautiful&nbsp;</span>
        <br />
        <span className={title()}>
          websites regardless of your design experience.
        </span>
        <div className={subtitle({ class: "mt-4" })}>
          Beautiful, fast and modern React UI library.
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          isExternal
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href={siteConfig.links.docs}
        >
          Documentation
        </Link>
        <Link
          isExternal
          className={buttonStyles({ variant: "bordered", radius: "full" })}
          href={siteConfig.links.github}
        >
          <GithubIcon size={20} />
          GitHub
        </Link>
      </div>

      <div className="mt-8">
        <Snippet hideCopyButton hideSymbol variant="bordered">
          <span>
            Get started by editing <Code color="primary">app/page.tsx</Code>
          </span>
        </Snippet>
      </div>
    </section>
  );
}
