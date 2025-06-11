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
  Stack,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
dayjs.extend(quarterOfYear);
import * as XLSX from 'xlsx';
import { generateCashFlowPDF } from '../../../utils/pdfGenerator';
import { cashFlowReportApi } from '../../../api';

const CashFlowReport = () => {
  const [startDate, setStartDate] = useState(dayjs().quarter(dayjs().quarter()).startOf('quarter'));
  const [endDate, setEndDate] = useState(dayjs().quarter(dayjs().quarter()).endOf('quarter'));
  const [cashFlowData, setCashFlowData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [summary, setSummary] = useState({ totalInflow: 0, totalOutflow: 0, netBalance: 0 });

  const saldoColor = summary.netBalance > 0 ? 'success.main' : summary.netBalance < 0 ? 'error.main' : 'text.primary';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await cashFlowReportApi.get({
          startDate: startDate ? startDate.format('YYYY-MM-DD') : undefined,
          endDate: endDate ? endDate.format('YYYY-MM-DD') : undefined
        });

        setSummary(res.data.summary || { totalInflow: 0, totalOutflow: 0, netBalance: 0 });
        const apiData = (res.data.monthly || []).map((item) => ({
          month: dayjs(item.month, 'YYYY-MM').format('MMM/YYYY'),
          inflow: item.inflow,
          outflow: item.outflow,
          balance: item.balance
        }));
        setCashFlowData(apiData);
        setMonthlyData(apiData);
      } catch (err) {
        setSummary({ totalInflow: 0, totalOutflow: 0, netBalance: 0 });
        setCashFlowData([]);
        setMonthlyData([]);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(monthlyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fluxo de Caixa');
    XLSX.writeFile(workbook, 'fluxo-de-caixa.xlsx');
  };

  const handleExportPDF = () => {
    console.log({
      data: monthlyData.map((row) => ({
        ...row,
        inflow: Number(row.inflow) || 0,
        outflow: Number(row.outflow) || 0,
        balance: Number(row.balance) || 0
      })),
      startDate: startDate.format('DD/MM/YYYY'),
      endDate: endDate.format('DD/MM/YYYY')
    });

    generateCashFlowPDF({
      data: monthlyData.map((row) => ({
        ...row,
        inflow: Number(row.inflow) || 0,
        outflow: Number(row.outflow) || 0,
        balance: Number(row.balance) || 0
      })),
      startDate: startDate.format('DD/MM/YYYY'),
      endDate: endDate.format('DD/MM/YYYY')
    });
  };

  return (
    <Box>
      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Data Inicial"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
                format="DD/MM/YYYY"
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Data Final"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
                format="DD/MM/YYYY"
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6} display="flex" justifyContent="flex-end" alignItems="center">
            <Stack direction="row" spacing={2}>
              <Button variant="contained" color="primary" onClick={handleExportExcel}>
                Exportar Excel
              </Button>
              <Button variant="contained" color="primary" onClick={handleExportPDF}>
                Exportar PDF
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter' }}>
            <Typography variant="subtitle2" color="success.main">
              Entradas
            </Typography>
            <Typography variant="h5" color="success.main" fontWeight={700}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalInflow)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: 'error.lighter' }}>
            <Typography variant="subtitle2" color="error.main">
              Saídas
            </Typography>
            <Typography variant="h5" color="error.main" fontWeight={700}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalOutflow)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.100' }}>
            <Typography variant="subtitle2" color={saldoColor}>
              Saldo
            </Typography>
            <Typography variant="h5" color={saldoColor} fontWeight={700}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.netBalance)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Evolução Mensal
        </Typography>
        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="inflow" stroke="#4CAF50" name="Entradas" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="outflow" stroke="#F44336" name="Saídas" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="balance" stroke="#2196F3" name="Saldo" strokeWidth={2} dot={{ r: 3 }} />
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
                    }).format(row.inflow)}
                  </TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(row.outflow)}
                  </TableCell>
                  <TableCell align="right">
                    <b style={{ color: row.balance > 0 ? '#388e3c' : row.balance < 0 ? '#d32f2f' : undefined }}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(row.balance)}
                    </b>
                  </TableCell>
                </TableRow>
              ))}

              <TableRow>
                <TableCell>
                  <b>Total</b>
                </TableCell>
                <TableCell align="right">
                  <b>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalInflow)}</b>
                </TableCell>
                <TableCell align="right">
                  <b>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalOutflow)}</b>
                </TableCell>
                <TableCell align="right">
                  <b style={{ color: saldoColor }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.netBalance)}
                  </b>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default CashFlowReport;
