import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import * as XLSX from 'xlsx';
import { generateCashFlowPDF } from '../../../utils/pdfGenerator';

dayjs.locale('pt-br');

const CashFlowReport = () => {
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month'));
  const [cashFlowData, setCashFlowData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  // Mock data - Replace with actual API calls
  useEffect(() => {
    // Simulando dados de contas a receber e pagar
    const mockReceivables = [
      { date: dayjs('2024-03-01'), value: 1500 },
      { date: dayjs('2024-03-15'), value: 2500 },
      { date: dayjs('2024-03-20'), value: 1800 }
    ];

    const mockPayables = [
      { date: dayjs('2024-03-05'), value: 800 },
      { date: dayjs('2024-03-10'), value: 1200 },
      { date: dayjs('2024-03-25'), value: 2500 }
    ];

    // Combinando e processando os dados
    const allTransactions = [
      ...mockReceivables.map((t) => ({ ...t, type: 'in' })),
      ...mockPayables.map((t) => ({ ...t, type: 'out' }))
    ].filter((t) => t.date.isAfter(startDate) && t.date.isBefore(endDate));

    // Agrupando por mês para o gráfico
    const monthlyFlow = {};
    allTransactions.forEach((transaction) => {
      const monthKey = transaction.date.format('YYYY-MM');
      if (!monthlyFlow[monthKey]) {
        monthlyFlow[monthKey] = { in: 0, out: 0 };
      }
      if (transaction.type === 'in') {
        monthlyFlow[monthKey].in += transaction.value;
      } else {
        monthlyFlow[monthKey].out += transaction.value;
      }
    });

    const chartData = Object.entries(monthlyFlow).map(([month, data]) => ({
      month: dayjs(month).format('MMM/YYYY'),
      entradas: data.in,
      saidas: data.out,
      saldo: data.in - data.out
    }));

    setCashFlowData(chartData);
    setMonthlyData(chartData);
  }, [startDate, endDate]);

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(monthlyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fluxo de Caixa');
    XLSX.writeFile(workbook, 'fluxo-de-caixa.xlsx');
  };

  const handleExportPDF = () => {
    generateCashFlowPDF({
      data: monthlyData,
      startDate: startDate.format('DD/MM/YYYY'),
      endDate: endDate.format('DD/MM/YYYY')
    });
  };

  return (
    <Box>
      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Data Inicial"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Data Final"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" color="primary" onClick={handleExportExcel} fullWidth>
                Exportar Excel
              </Button>
              <Button variant="contained" color="primary" onClick={handleExportPDF} fullWidth>
                Exportar PDF
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Gráfico de Entradas vs Saídas
        </Typography>
        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="entradas" stroke="#4CAF50" name="Entradas" />
              <Line type="monotone" dataKey="saidas" stroke="#F44336" name="Saídas" />
              <Line type="monotone" dataKey="saldo" stroke="#2196F3" name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mês</TableCell>
                <TableCell align="right">Entradas</TableCell>
                <TableCell align="right">Saídas</TableCell>
                <TableCell align="right">Saldo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthlyData.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(row.entradas)}
                  </TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(row.saidas)}
                  </TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(row.saldo)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default CashFlowReport;
