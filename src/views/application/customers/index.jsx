import {
  Box,
  CardContent,
  Checkbox,
  Fab,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { visuallyHidden } from '@mui/utils';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AddIcon from '@mui/icons-material/AddTwoTone';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import SearchIcon from '@mui/icons-material/Search';

import MainCard from 'ui-component/cards/MainCard';
import ClientAddDialog from './ClienteAddDialog';
import ClienteEditSideDialog from './ClienteEditSideDialog';

import { customersApi } from 'api/index';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}
const getComparator = (order, orderBy) =>
  order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);
function stableSort(array, comparator) {
  const stabilized = array.map((el, i) => [el, i]);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    return order !== 0 ? order : a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

const headCells = [
  { id: 'fullName', numeric: false, label: 'Nome do Cliente', align: 'left' },
  { id: 'email', numeric: false, label: 'Email', align: 'left' },
  { id: 'phone', numeric: false, label: 'Telefone', align: 'left' },
  { id: 'createdAt', numeric: false, label: 'Data de Registro', align: 'center' }
];

function EnhancedTableHead({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, selected, onDelete }) {
  const createSortHandler = (property) => (e) => onRequestSort(e, property);

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox" sx={{ pl: 3 }}>
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'selecionar todos os clientes' }}
          />
        </TableCell>

        {numSelected > 0 && (
          <TableCell padding="none" colSpan={headCells.length + 1}>
            <EnhancedTableToolbar numSelected={selected.length} onDelete={onDelete} />
          </TableCell>
        )}

        {numSelected === 0 &&
          headCells.map((cell) => (
            <TableCell key={cell.id} align={cell.align} sortDirection={orderBy === cell.id ? order : false}>
              <TableSortLabel
                active={orderBy === cell.id}
                direction={orderBy === cell.id ? order : 'asc'}
                onClick={createSortHandler(cell.id)}
              >
                {cell.label}
                {orderBy === cell.id && (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc' ? 'ordenado decrescente' : 'ordenado crescente'}
                  </Box>
                )}
              </TableSortLabel>
            </TableCell>
          ))}

        {numSelected === 0 && (
          <TableCell align="center" sx={{ pr: 3 }}>
            <Typography variant="h5">Ação</Typography>
          </TableCell>
        )}
      </TableRow>
    </TableHead>
  );
}
EnhancedTableHead.propTypes = {
  onSelectAllClick: PropTypes.func,
  order: PropTypes.string,
  orderBy: PropTypes.string,
  numSelected: PropTypes.number,
  rowCount: PropTypes.number,
  onRequestSort: PropTypes.func,
  selected: PropTypes.array,
  onDelete: PropTypes.func
};

const EnhancedTableToolbar = ({ numSelected, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setOpenConfirm(false);
    } catch (error) {
      // Error is already handled in the parent component
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Toolbar sx={{ p: 0, pl: 1, pr: 1, ...(numSelected > 0 && { color: 'secondary.main' }) }}>
        {numSelected > 0 ? (
          <Typography color="inherit" variant="h4">
            {numSelected} selecionado(s)
          </Typography>
        ) : (
          <Typography variant="h6">Clientes</Typography>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {numSelected > 0 && (
          <Tooltip title="Excluir">
            <IconButton size="large" onClick={() => setOpenConfirm(true)} disabled={isDeleting}>
              {isDeleting ? <CircularProgress size={24} /> : <DeleteIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir {numSelected} cliente{numSelected > 1 ? 's' : ''}? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" disabled={isDeleting}>
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onDelete: PropTypes.func
};

export default function Clientes() {
  const [openAdd, setOpenAdd] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const [rows, setRows] = useState([]);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('fullName');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      await Promise.all(selected.map((id) => customersApi.remove(id)));
      setRows((currentRows) => currentRows.filter((row) => !selected.includes(row._id)));
      setSelected([]);
    } catch (err) {
      console.error('Erro ao excluir clientes', err);
      throw err;
    }
  };

  const loadClients = async () => {
    try {
      const { data } = await customersApi.list();
      setRows(data);
    } catch (err) {
      console.error('Erro ao buscar clientes', err);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) => r.fullName?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.phone?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const handleRequestSort = (_e, prop) => setOrder(orderBy === prop && order === 'asc' ? 'desc' : 'asc') || setOrderBy(prop);

  const handleSelectAllClick = (e) => setSelected(e.target.checked ? filteredRows.map((r) => r._id) : []);

  const handleRowClick = (_e, _id) => setSelected((prev) => (prev.includes(_id) ? prev.filter((p) => p !== _id) : [...prev, _id]));

  const handleMoreActions = (e, row) => {
    setSelectedRow(row);
    setMenuAnchor(e.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const handleEdit = () => {
    setMenuAnchor(null);
    setTimeout(() => {
      setEditOpen(true);
    }, 100);
  };

  const handleDetails = () => {
    setMenuAnchor(null);
    selectedRow?._id && navigate(`/customers/${selectedRow._id}`);
  };

  const handleCloseEditDialog = () => {
    setEditOpen(false);
    setSelectedRow(null);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRows.length) : 0;

  return (
    <MainCard content={false}>
      <CardContent>
        <Grid container spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Grid xs={12} sm={6}>
            <TextField
              size="small"
              placeholder="Buscar Cliente"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid xs={12} sm={6} sx={{ textAlign: 'right' }}>
            <Tooltip title="Adicionar Cliente">
              <Fab
                color="primary"
                size="small"
                onClick={() => setOpenAdd(true)}
                sx={{ boxShadow: 'none', ml: 1, width: 32, height: 32, minHeight: 32 }}
              >
                <AddIcon fontSize="small" />
              </Fab>
            </Tooltip>
            <ClientAddDialog open={openAdd} handleCloseDialog={() => setOpenAdd(false)} onClientCreated={loadClients} />
          </Grid>
        </Grid>
      </CardContent>

      <TableContainer>
        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
          <EnhancedTableHead
            numSelected={selected.length}
            order={order}
            orderBy={orderBy}
            onSelectAllClick={handleSelectAllClick}
            onRequestSort={handleRequestSort}
            rowCount={filteredRows.length}
            selected={selected}
            onDelete={handleDelete}
          />

          <TableBody>
            {stableSort(filteredRows, getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, idx) => {
                const isItemSelected = selected.includes(row._id);
                const labelId = `enhanced-table-checkbox-${idx}`;

                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row._id} selected={isItemSelected} aria-checked={isItemSelected}>
                    <TableCell padding="checkbox" onClick={(e) => handleRowClick(e, row._id)}>
                      <Checkbox color="primary" checked={isItemSelected} inputProps={{ 'aria-labelledby': labelId }} />
                    </TableCell>

                    <TableCell>
                      <Typography variant="h5">{row.fullName}</Typography>
                    </TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell align="center">{row.createdAt && new Date(row.createdAt).toLocaleDateString()}</TableCell>

                    <TableCell align="center" sx={{ pr: 3 }}>
                      <Tooltip title="Mais ações">
                        <IconButton size="large" onClick={(e) => handleMoreActions(e, row)}>
                          <MoreHorizOutlinedIcon sx={{ fontSize: '1.3rem' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}

            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={headCells.length + 1} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredRows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} TransitionProps={{ onExited: () => setMenuAnchor(null) }}>
        <MenuItem onClick={handleEdit}>Editar</MenuItem>
        <MenuItem onClick={handleDetails}>Detalhes</MenuItem>
      </Menu>

      <ClienteEditSideDialog
        open={editOpen}
        clientData={selectedRow}
        handleCloseDialog={handleCloseEditDialog}
        onClientUpdated={loadClients}
      />
    </MainCard>
  );
}
