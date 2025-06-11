import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
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
  Box,
  Grid2 as Grid,
  Menu,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useNavigate } from 'react-router-dom';

import AddIcon from '@mui/icons-material/AddTwoTone';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import SearchIcon from '@mui/icons-material/Search';

import MainCard from 'ui-component/cards/MainCard';
import ProfissionalAddDialog from './ProfissionalAddDialog';
import ProfessionalEditSideDialog from './ProfessionalEditSideDialog';
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
  { id: 'fullName', numeric: false, label: 'Nome do Profissional', align: 'left' },
  { id: 'contact', numeric: false, label: 'Telefone', align: 'left' },
  { id: 'documents', numeric: false, label: 'Documento', align: 'left' },
  { id: 'createdAt', numeric: false, label: 'Data de Registro', align: 'center' }
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
            inputProps={{ 'aria-label': 'selecionar todos os profissionais' }}
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

const EnhancedTableToolbar = ({ numSelected, onDelete, isDeleting }) => (
  <Toolbar sx={{ p: 0, pl: 1, pr: 1, ...(numSelected > 0 && { color: 'secondary.main' }) }}>
    {numSelected > 0 ? (
      <Typography color="inherit" variant="h4">
        {numSelected} selecionado(s)
      </Typography>
    ) : (
      <Typography variant="h6" id="tableTitle">
        Profissionais
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

function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

export default function Profissionais() {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('fullName');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const navigate = useNavigate();

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await professionalsApi.list();
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar profissionais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfessionals();
  }, []);

  const handleSearch = (event) => {
    const query = event.target.value || '';
    setSearch(query);
  };

  const filteredRows = React.useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (prof) =>
        prof.fullName?.toLowerCase().includes(q) || prof.phone?.toLowerCase().includes(q) || prof.documents?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const handleOpenDialog = () => setOpen(true);
  const handleCloseDialog = () => setOpen(false);

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
      await Promise.all(selected.map((id) => professionalsApi.remove(id)));
      await loadProfessionals();
      setSelected([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao excluir profissionais');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoreActionsClick = (event, professional) => {
    setMenuAnchor(event.currentTarget);
    setSelectedProfessional(professional);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedProfessional(null);
  };

  const handleEdit = () => {
    setMenuAnchor(null);
    setTimeout(() => {
      setEditDialogOpen(true);
    }, 100);
  };

  const handleDetails = () => {
    setMenuAnchor(null);
    selectedProfessional?._id && navigate(`/professionals/${selectedProfessional._id}`);
  };

  const handleSchedule = () => {
    setMenuAnchor(null);
    selectedProfessional?._id && navigate(`/professionals/${selectedProfessional._id}/schedule`);
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
              placeholder="Buscar Profissional"
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
            <Tooltip title="Adicionar Profissional">
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

      <ProfissionalAddDialog open={open} handleCloseDialog={handleCloseDialog} onProfessionalCreated={loadProfessionals} />

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
                .map((profissional, index) => {
                  const isItemSelected = isSelected(profissional._id);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={profissional._id}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox" onClick={(event) => handleClick(event, profissional._id)}>
                        <Checkbox color="primary" checked={isItemSelected} inputProps={{ 'aria-labelledby': labelId }} />
                      </TableCell>

                      <TableCell component="th" id={labelId} scope="row">
                        <Typography variant="h5">{profissional.fullName}</Typography>
                      </TableCell>

                      <TableCell>{formatPhone(profissional.contact)}</TableCell>

                      <TableCell>{profissional.documents}</TableCell>

                      <TableCell align="center">
                        {profissional.createdAt && new Date(profissional.createdAt).toLocaleDateString()}
                      </TableCell>

                      <TableCell align="center" sx={{ pr: 3 }}>
                        <Tooltip title="Mais ações">
                          <IconButton size="large" onClick={(event) => handleMoreActionsClick(event, profissional)}>
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
        <MenuItem onClick={handleSchedule}>Agenda</MenuItem>
      </Menu>

      <ProfessionalEditSideDialog
        open={editDialogOpen}
        professionalData={selectedProfessional}
        handleCloseDialog={() => {
          setEditDialogOpen(false);
          setSelectedProfessional(null);
        }}
        onProfessionalUpdated={loadProfessionals}
      />
    </MainCard>
  );
}
