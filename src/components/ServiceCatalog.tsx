import React, { useState, useEffect } from 'react';
import { useTheme } from '@material-ui/core/styles';
import { Grid, Chip, TextField, Button, Typography } from '@material-ui/core';
import { Skeleton, Fade, Slide } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ServiceCard, ServiceGrid, ServiceItem } from './ServiceCard';
import { Service } from './types';
import { useIntersectionObserver } from './useIntersectionObserver';
import { useBottomSheet } from './useBottomSheet';
import { useLoading } from './useLoading';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  chip: {
    margin: theme.spacing(1),
  },
  filter: {
    marginBottom: theme.spacing(2),
  },
  loading: {
    padding: theme.spacing(2),
  },
}));

const ServiceCatalog = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [services, setServices] = useState<Service[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    durationRange: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerRow, setItemsPerRow] = useState(2);

  const { ref, inView } = useIntersectionObserver({
    rootMargin: '50px',
  });

  const { openBottomSheet, closeBottomSheet } = useBottomSheet();

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const handleFilterReset = () => {
    setFilters({
      category: '',
      priceRange: '',
      durationRange: '',
    });
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    // Implementar lógica de ordenamiento
  };

  const handleServiceClick = (service: Service) => {
    openBottomSheet(service);
  };

  const loadMoreServices = () => {
    // Implementar lógica de carga de servicios adicionales
    setPage((prevPage) => prevPage + 1);
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        const data = await response.json();
        setServices(data);
        setLoading(false);
      } catch (error) {
        setError(true);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (inView && services.length < 100) {
      loadMoreServices();
    }
  }, [inView, services.length]);

  const filteredServices = services
    .filter((service) => {
      if (filters.category) {
        return service.category === filters.category;
      }
      return true;
    })
    .filter((service) => {
      if (filters.priceRange) {
        return service.priceTotal >= filters.priceRange[0] && service.priceTotal <= filters.priceRange[1];
      }
      return true;
    })
    .filter((service) => {
      if (filters.durationRange) {
        return service.durationMinutes >= filters.durationRange[0] && service.durationMinutes <= filters.durationRange[1];
      }
      return true;
    });

  return (
    <div className={classes.root}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Chip
            label="Consulta y diagnóstico"
            color="primary"
            className={classes.chip}
            onClick={() => setFilters({ ...filters, category: 'Consulta y diagnóstico' })}
          />
          <Chip
            label="Limpieza y prevención"
            color="primary"
            className={classes.chip}
            onClick={() => setFilters({ ...filters, category: 'Limpieza y prevención' })}
          />
          {/* Agregar más chips de categoría */}
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Buscar servicios"
            variant="outlined"
            fullWidth
            onChange={handleFilterChange}
            name="search"
            value={filters.search}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleFilterReset}
            className={classes.filter}
          >
            Limpiar filtros
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Servicios
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSortChange({ target: { value: 'price' } })}
            className={classes.filter}
          >
            Ordenar por precio
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSortChange({ target: { value: 'duration' } })}
            className={classes.filter}
          >
            Ordenar por duración
          </Button>
        </Grid>
        <Grid item xs={12}>
          {loading ? (
            <div className={classes.loading}>
              {Array(12)
                .fill(null)
                .map((_, index) => (
                  <Skeleton key={index} variant="rectangular" height={150} />
                ))}
            </div>
          ) : (
            <ServiceGrid
              services={filteredServices}
              itemsPerRow={itemsPerRow}
              onServiceClick={handleServiceClick}
            />
          )}
        </Grid>
        {error && (
          <Grid item xs={12}>
            <Typography variant="body1" color="error">
              Error al cargar servicios. Intente nuevamente.
            </Typography>
          </Grid>
        )}
      </Grid>
      {openBottomSheet && (
        <ServiceItem
          service={openBottomSheet}
          onClose={closeBottomSheet}
          onReserve={() => console.log('Reservar servicio')}
        />
      )}
    </div>
  );
};

export default ServiceCatalog;