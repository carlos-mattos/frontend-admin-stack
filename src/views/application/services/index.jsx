import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import {
  Box,
  CardContent,
  Checkbox,
  Fab,
  IconButton,
  InputAdornment,
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
  Menu,
  MenuItem,
  Grid2 as Grid,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useNavigate } from 'react-router-dom';

import AddIcon from '@mui/icons-material/AddTwoTone';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import SearchIcon from '@mui/icons-material/Search';

import MainCard from 'ui-component/cards/MainCard';
import ServiceAddDialog from './ServiceAddDialog';
import ServiceEditSideDialog from './ServiceEditSideDialog';
import { servicesApi } from 'api/index';
import { professionalsApi } from 'api/index';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  { id: 'name', numeric: false, label: 'Nome do Serviço', align: 'left' },
  { id: 'category', numeric: false, label: 'Categoria', align: 'left' },
  { id: 'duration', numeric: true, label: 'Duração (h)', align: 'right' },
  { id: 'price', numeric: true, label: 'Preço', align: 'right' },
  { id: 'nextContactDays', numeric: true, label: 'Retorno (dias)', align: 'right' }
];

function EnhancedTableHead(props) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, selected, onDelete } = props;

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox" sx={{ pl: 3 }}>
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'selecionar todos os serviços' }}
          />
        </TableCell>

        {numSelected > 0 && (
          <TableCell padding="none" colSpan={headCells.length + 1}>
            <EnhancedTableToolbar numSelected={selected.length} onDelete={onDelete} />
          </TableCell>
        )}

        {numSelected <= 0 &&
          headCells.map((headCell) => (
            <TableCell key={headCell.id} align={headCell.align} sortDirection={orderBy === headCell.id ? order : false}>
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc' ? 'ordenado decrescente' : 'ordenado crescente'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
          ))}

        {numSelected <= 0 && (
          <TableCell align="center" sx={{ pr: 3 }}>
            <Typography variant="h5">Ação</Typography>
          </TableCell>
        )}
      </TableRow>
    </TableHead>
  );
}

const EnhancedTableToolbar = ({ numSelected, onDelete, isDeleting }) => (
  <Toolbar sx={{ p: 0, pl: 1, pr: 1, ...(numSelected > 0 && { color: 'secondary.main' }) }}>
    {numSelected > 0 ? (
      <Typography color="inherit" variant="h4">
        {numSelected} selecionado(s)
      </Typography>
    ) : (
      <Typography variant="h6" id="tableTitle">
        Serviços
      </Typography>
    )}
    <Box sx={{ flexGrow: 1 }} />
    {numSelected > 0 && (
      <Tooltip title="Excluir">
        <IconButton size="large" onClick={onDelete} disabled={isDeleting}>
          {isDeleting ? <CircularProgress size={24} /> : <DeleteIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    )}
  </Toolbar>
);

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onDelete: PropTypes.func.isRequired,
  isDeleting: PropTypes.bool
};

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

export default function Servicos() {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const navigate = useNavigate();

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await servicesApi.list();
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenDialog = () => setOpen(true);
  const handleCloseDialog = () => setOpen(false);

  const handleSearch = (event) => {
    const query = event.target.value || '';
    setSearch(query);
  };

  const filteredRows = React.useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((service) => service.name?.toLowerCase().includes(q) || service.category?.toLowerCase().includes(q));
  }, [rows, search]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredRows.map((n) => n._id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const handleDeleteSelected = async () => {
    try {
      setIsDeleting(true);

      // Check if any of the selected services are being used by professionals
      const { data: professionals } = await professionalsApi.list();
      const servicesInUse = new Set();

      professionals.forEach((professional) => {
        professional.serviceHandled?.forEach((serviceId) => {
          if (selected.includes(serviceId)) {
            servicesInUse.add(serviceId);
          }
        });
      });

      if (servicesInUse.size > 0) {
        const servicesInUseList = Array.from(servicesInUse);
        const servicesInUseNames = rows
          .filter((service) => servicesInUseList.includes(service._id))
          .map((service) => service.name)
          .join(', ');

        setError(`Não é possível excluir os serviços pois estão sendo utilizados por profissionais: ${servicesInUseNames}`);
        return;
      }

      // If no services are in use, proceed with deletion
      await Promise.all(selected.map((id) => servicesApi.remove(id)));
      await loadServices();
      setSelected([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao excluir serviços');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoreActionsClick = (event, service) => {
    setMenuAnchor(event.currentTarget);
    setSelectedService(service);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedService(null);
  };

  const handleEdit = () => {
    setMenuAnchor(null);
    setTimeout(() => {
      setEditDialogOpen(true);
    }, 100);
  };

  const handleDetails = () => {
    setMenuAnchor(null);
    selectedService?._id && navigate(`/apps/servicos/detalhes/${selectedService._id}`);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRows.length) : 0;

  return (
    <MainCard content={false}>
      <CardContent>
        <Grid container spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Grid xs={12} sm={6}>
            <TextField
              size="small"
              value={search}
              onChange={handleSearch}
              placeholder="Buscar Serviço"
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
            <Tooltip title="Adicionar Serviço">
              <Fab color="primary" size="small" onClick={handleOpenDialog} sx={{ boxShadow: 'none', width: 34, height: 34, minHeight: 34 }}>
                <AddIcon fontSize="small" />
              </Fab>
            </Tooltip>
          </Grid>
        </Grid>
      </CardContent>

      {error && (
        <Box p={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <ServiceAddDialog open={open} handleCloseDialog={handleCloseDialog} onServiceCreated={loadServices} />

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
            onDelete={handleDeleteSelected}
          />
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={headCells.length + 2} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              stableSort(filteredRows, getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((service, index) => {
                  const isItemSelected = isSelected(service._id);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow hover role="checkbox" aria-checked={isItemSelected} tabIndex={-1} key={service._id} selected={isItemSelected}>
                      <TableCell padding="checkbox" onClick={(event) => handleClick(event, service._id)}>
                        <Checkbox color="primary" checked={isItemSelected} inputProps={{ 'aria-labelledby': labelId }} />
                      </TableCell>

                      <TableCell component="th" id={labelId} scope="row">
                        <Typography variant="h5">{service.name}</Typography>
                      </TableCell>

                      <TableCell>{service.category}</TableCell>

                      <TableCell align="right">{service.duration}h</TableCell>

                      <TableCell align="right">R$ {service.price.toFixed(2)}</TableCell>

                      <TableCell align="right">{service.nextContactDays} dias</TableCell>

                      <TableCell align="center" sx={{ pr: 3 }}>
                        <Tooltip title="Mais ações">
                          <IconButton size="large" onClick={(event) => handleMoreActionsClick(event, service)}>
                            <MoreHorizOutlinedIcon sx={{ fontSize: '1.3rem' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}

            {!loading && emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={headCells.length + 2} />
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
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        TransitionProps={{ onExited: () => setMenuAnchor(null) }}
      >
        <MenuItem onClick={handleEdit}>Editar</MenuItem>
        <MenuItem onClick={handleDetails}>Detalhes</MenuItem>
      </Menu>

      <ServiceEditSideDialog
        open={editDialogOpen}
        serviceData={selectedService}
        handleCloseDialog={() => {
          setEditDialogOpen(false);
          setSelectedService(null);
        }}
        onServiceUpdated={loadServices}
      />
    </MainCard>
  );
}
