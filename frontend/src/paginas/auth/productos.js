import React, { useEffect, useState,useRef } from 'react';
import Header2 from '../../componentes/header2';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSearch,faFilter } from '@fortawesome/free-solid-svg-icons';
import '../../styles/productos.css'

const Productos = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    imagen: '',
    categoria_id: '', 
    composicion: '',
    contenido_neto: '',
    usos: '',
    advertencias: '',
    cantidad_producto: '',
    precio_unitario: '',
    estado: '' 
  });

  const [productos, setProductos] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [categorias, setCategorias] = useState([]); // Para almacenar las categorías
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // Estado para filtro
  const [productsTypeFilter, setProductsTypeFilter] = useState('todos');
  const [showFilters, setShowFilters] = useState(false);
  const filterMenuRef = useRef(null);

    // Paginación
    const [currentPageProduct, setCurrentPageProduct] = useState(1);
    const recordsPerPage = 3;

  const fetchProductos = async () => {
    try {
      const response = await axios.get('http://localhost:4001/Producto');
      setProductos(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await axios.get('http://localhost:4001/categoria');
      setCategorias(response.data); // Asumiendo que la respuesta tiene la estructura esperada
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchCategorias(); // Llamar a la función para obtener las categorías al cargar el componente
  }, []);

  // Manejar cambio en los campos de formulario
  const handleInputChange = (e) => {
    const { id, value } = e.target;

    setFormData((prevFormData) => {
      const newFormData = { ...prevFormData, [id]: value };

      return newFormData;
    });
  };

  const handleKeyPress = (event) => {
    // Permite solo letras y espacios
    if (!/^[a-zA-Z\s]*$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // Función para registrar un nuevo producto
  const handleRegisterProduct = async () => {
    const requiredFields = ['nombre', 'descripcion', 'imagen', 'categoria_id', 'composicion', 'contenido_neto', 'usos', 'advertencias', 'cantidad_producto', 'precio_unitario'];
    const isFormValid = requiredFields.every(field => formData[field]);

    if (!isFormValid) {
      Swal.fire({
        title: 'Complete todos los campos requeridos',
        text: 'Por favor, asegúrese de que todos los campos obligatorios estén completos.',
        icon: 'warning',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    try {
      await axios.post('http://localhost:4001/registrarProducto', formData);
      fetchProductos(); // Actualizar la lista de productos
      resetForm();
      Swal.fire({
        title: 'Producto registrado!!',
        text: `El producto "${formData.nombre}" se registró`,
        icon: 'success',
        showConfirmButton: false,
        timer: 1000, 
      });
    } catch (error) {
      console.error('Error registering product:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo registrar el producto.',
        icon: 'error',
        showConfirmButton: false,
        timer: 2000, 
      });
    }
  };


// Función para editar un producto
const handleEditProduct = (product) => {
  setIsEditing(true);
  setCurrentProduct(product);
  setFormData(product);
};

// Función para actualizar un producto
const handleUpdateProduct = async () => {
  const requiredFields = ['nombre', 'descripcion', 'imagen', 'categoria_id', 'composicion', 'contenido_neto', 'usos', 'advertencias', 'cantidad_producto', 'precio_unitario'];
  const isFormValid = requiredFields.every(field => formData[field]);

  if (!isFormValid) {
    Swal.fire({
      title: 'Complete todos los campos requeridos',
      text: 'Por favor, asegúrese de que todos los campos obligatorios estén completos.',
      icon: 'warning',
      timer: 2000,
      showConfirmButton: false
    });
    return;
  }

  try {
    await axios.put('http://localhost:4001/actualizarProducto', { 
      ...formData, 
      id_producto: currentProduct.id_producto // Asegúrate de pasar el ID del producto que se está editando
    });
    fetchProductos(); // Actualizar la lista de productos
    resetForm();
    Swal.fire({
      title: 'Producto actualizado!!',
      text: `El producto "${formData.nombre}" se actualizó`,
      icon: 'success',
      showConfirmButton: false,
      timer: 1000, 
    });
  } catch (error) {
    console.error('Error updating product:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudo actualizar el producto.',
      icon: 'error',
      showConfirmButton: false,
      timer: 2000, 
    });
  }
};

// Descontinuar producto
const handleSetInactiveProduct = async (id_producto) => {
  const confirmInactive = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, descontinuar',
      cancelButtonText: 'Cancelar'
  });

  if (confirmInactive.isConfirmed) {
      try {
          const response = await axios.put(`http://localhost:4001/descontinuarProducto/${id_producto}`, {
          estado: 'descontinuado'
        });
        console.log("datos", response.data)

          Swal.fire({
              title: 'Producto descontinuado',
              text: 'El producto se ha descontinuado.',
              icon: 'success',
              showConfirmButton: false,
              timer: 1000,
          }).then(() => {
            fetchProductos(); 
          });
      } catch (error) {
          console.error('Error descontinuando producto:', error);
          Swal.fire({
              title: 'Error',
              text: 'No se pudo descontinuar el producto.',
              icon: 'error',
              showConfirmButton: false,
              timer: 2000,
          });
      }
  }
};

  // Filtrar productos basados en el término de búsqueda y en la categoría
  const filteredProducts = productos
    .filter((producto) => 
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.id.toString().includes(searchTerm.toLowerCase())
    )
    .filter((producto) => {
      if (productsTypeFilter === 'todos') return true;
      return [
        'Cuidado de la Ropa', 
        'Hogar y Limpieza', 
        'Cuidado de Pisos', 
        'Desinfectantes'
      ].includes(productsTypeFilter) && producto.categoria === productsTypeFilter;
    });

  // Paginación
  const indexOfLastRecordProduct = currentPageProduct * recordsPerPage;
  const indexOfFirstRecordProduct = indexOfLastRecordProduct - recordsPerPage;
  const currentRecordsProduct = filteredProducts.slice(indexOfFirstRecordProduct, indexOfLastRecordProduct);
  const totalPagesProduct = Math.ceil(filteredProducts.length / recordsPerPage);

  // Cambiar de página
  const handlePageChangeProduct = (pageNumber) => {
    setCurrentPageProduct(pageNumber);
  };

  
  useEffect(() => {
    // Obtener la lista de productos actualizada
    const fetchProductos = async () => {
      try {
        const response = await axios.get('http://localhost:4001/Producto');
        setProductos(response.data);
      } catch (error) {
        console.error('Error al obtener los productos:', error);
      }
    };

    fetchProductos();
  }, []);   

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      imagen: '',
      categoria: '',
      composicion: '',
      contenido_neto: '',
      usos: '',
      advertencias: '',
      precio_unitario: '',
      cantidad_producto:'',
      estado:''
    });
    setCurrentProduct(null);
  };

   // Función para manejar el cambio en el input de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle user type filter change
  const handleProductsTypeFilterChange = (e) => {
    setProductsTypeFilter(e.target.value);
  };


  return (
    <div>
      <Header2 />
      <div className="container">
        <h2>Registro de productos</h2>
        {/* Campo de búsqueda */}
        <div className="d-flex justify-content-between align-items-center mb-3 position-relative">
          {/* Barra de búsqueda */}
  <div className="d-flex align-items-center">
    <FontAwesomeIcon icon={faSearch} className="me-2" style={{ fontSize: '20px' }} />
    <input
      type="text"
      id="searchInput"
      className="form-control"
      placeholder="Buscar por ID o Nombre"
      value={searchTerm}
      onChange={handleSearchChange}
    />
    {/* Ícono de filtro */}
    <button
      type="button"
      className="btn btn-light ms-2 position-relative"
      onClick={() => setShowFilters(!showFilters)}
    >
      <FontAwesomeIcon icon={faFilter} style={{ fontSize: '20px' }} />
    </button>
    {showFilters && (
      <div ref={filterMenuRef} className="filter-menu position-absolute mt-2 p-2 bg-white border rounded shadow">
        <select id="productsTypeFilter" className="form-select" value={productsTypeFilter} onChange={handleProductsTypeFilterChange}>
          <option value="todos">Todos</option>
          <option value="Cuidado de la Ropa">Cuidado de la Ropa</option>
          <option value="Hogar y Limpieza">Hogar y Limpieza</option>
          <option value="Cuidado de Pisos">Cuidado de Pisos</option>
          <option value="Desinfectantes">Desinfectantes</option>
        </select>
      </div>
    )}
  </div>
          <button type="button" className="btn btn-success mt-2" data-bs-toggle="modal" data-bs-target="#registroProductoModal">
            Registrar Producto
          </button>
        </div>
        {/* Modal */}
        <div className="modal fade" id="registroProductoModal" tabIndex={-1} aria-labelledby="registroProductoModalLabel" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="registroProductoModalLabel">Registrar Producto</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" /></div>
              <div className="modal-body">
                <form>
                  {/* Formulario de registro */}
                  <div className="mb-3">
                    <label htmlFor="nombre" className="form-label">Nombre</label>
                    <input type="text" className="form-control" id="nombre" placeholder="Ingrese nombre del producto" value={formData.nombre} onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="descripcion" className="form-label">Descripción</label>
                    <input type="text" className="form-control" id="descripcion" placeholder="Ingrese descripción del producto" value={formData.descripcion} onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Imagen (URL)</label>
                    <input
                      type="text" className="form-control" id="imagen" value={formData.imagen} onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
            <label className="form-label">Categoría</label>
            <select
              className="form-control"
              id="categoria_id"
              value={formData.categoria_id}
              onChange={handleInputChange}
            >
              <option selected disabled value="">Selecciona una categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id_categoria} value={categoria.id_categoria}>
                  {categoria.nombre_categoria}
                </option>
              ))}
            </select>
          </div>
                  <div className="mb-3">
                    <label htmlFor="composicion" className="form-label">Composición</label>
                    <input type="text" className="form-control" id="composicion" placeholder="Ingrese composición del producto" value={formData.composicion} onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="contenido_neto" className="form-label">Contenido Neto</label>
                    <input type="text" className="form-control" id="contenido_neto" placeholder="Ingrese contenido neto del producto" value={formData.contenido_neto} onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="usos" className="form-label">Usos</label>
                    <input type="text" className="form-control" id="usos" placeholder="Ingrese usos del producto" value={formData.usos} onChange={handleInputChange} onKeyPress={handleKeyPress} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="advertencias" className="form-label">Advertencias</label>
                    <input type="text" className="form-control" id="advertencias" placeholder="Ingrese advertencias del producto" value={formData.advertencias} onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="cantidad" className="form-label">Cantidad</label>
                    <input type="number" className="form-control" id="cantidad_producto" placeholder="Ingrese la cantidad a ingresar" value={formData.cantidad_producto} onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="precio_unitario" className="form-label">Precio Unitario</label>
                    <input type="text" className="form-control" id="precio_unitario" placeholder="Ingrese precio unitario del producto" value={formData.precio_unitario} onChange={handleInputChange} />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={resetForm}>Cerrar</button>
                <button type="button" className="btn btn-success" onClick={isEditing ? handleUpdateProduct : handleRegisterProduct}>
                  {isEditing ? 'Guardar Cambios' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Contenedor centrado para la tabla */}
        <div className="d-flex justify-content-center mt-4">
          <div className="table-container">
            <table className="table table-striped">
              <thead>
                <tr>
                <th style={{ width: '120px' }}>Imagen</th>
                  <th style={{ width: '80px' }}>ID Producto</th>
                  <th style={{ width: '150px' }}>Nombre</th>
                  <th style={{ width: '200px' }}>Descripción</th>
                  <th style={{ width: '120px' }}>Categoría</th>
                  <th style={{ width: '150px' }}>Composición</th>
                  <th style={{ width: '120px' }}>Contenido Neto</th>
                  <th style={{ width: '150px' }}>Usos</th>
                  <th style={{ width: '150px' }}>Advertencias</th>
                  <th style={{ width: '100px' }}>Cantidad</th>
                  <th style={{ width: '120px' }}>Precio Unitario</th>
                  <th style={{ width: '100px' }}>Estado</th>
                  <th style={{ width: '100px' }}>Editar</th>
                  <th style={{ width: '100px' }}>Eliminar</th>
                </tr>
              </thead>
              <tbody>
              {currentRecordsProduct.length > 0 ? (
                currentRecordsProduct.map((product, index) => (
                  <tr key={index}>
                    <td>
                      <img src={product.imagen} alt="producto" style={{ width: '100px', height: 'auto' }} />
                    </td>
                    <td>{product.id_producto}</td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.nombre}
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.descripcion}
                    </td>
                    <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.categoria}
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.composicion}
                    </td>
                    <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.contenido_neto}
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.usos}
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.advertencias}
                    </td>
                    <td>{product.cantidad_producto}</td>
                    <td>{product.precio_unitario}</td>
                    <td>{product.estado}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-sm"
                        data-bs-toggle="modal"
                        style={{ background: 'none', border: 'none' }}
                        data-bs-target="#registroProductoModal"
                        onClick={() => handleEditProduct(product)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-sm"
                        style={{ background: 'none', border: 'none' }}
                        onClick={() => handleSetInactiveProduct(product.id_producto)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <tr key={index}>
                    <td>
                      <img src={product.imagen} alt="producto" style={{ width: '100px', height: 'auto' }} />
                    </td>
                    <td>{product.id}</td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.nombre}
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.descripcion}
                    </td>
                    <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.categoria}
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.composicion}
                    </td>
                    <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.contenido_neto}
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.usos}
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.advertencias}
                    </td>
                    <td>{product.cantidad_producto}</td>
                    <td>{product.precio_unitario}</td>
                    <td>{product.estado}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-sm"
                        data-bs-toggle="modal"
                        style={{ background: 'none', border: 'none' }}
                        data-bs-target="#registroProductoModal"
                        onClick={() => handleEditProduct(product)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-sm"
                        style={{ background: 'none', border: 'none' }}
                        onClick={() => handleSetInactiveProduct(product.id_producto)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="14" className="text-center">No se encontraron productos.</td>
                </tr>
              )}
            </tbody>


            </table>
          </div>
        </div>
      </div>
      {/* Paginación */}
      <nav aria-label="Page navigation example">
            <ul className="pagination justify-content-center">
              <li className="page-item">
                <button
                  className="page-link"
                  onClick={() => handlePageChangeProduct(currentPageProduct - 1)}
                  disabled={currentPageProduct === 1}
                >
                  Anterior
                </button>
              </li>
              {Array.from({ length: totalPagesProduct }, (_, index) => (
                <li key={index + 1} className={`page-item ${currentPageProduct === index + 1 ? 'active' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChangeProduct(index + 1)}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}
              <li className="page-item">
                <button
                  className="page-link"
                  onClick={() => handlePageChangeProduct(currentPageProduct + 1)}
                  disabled={currentPageProduct === totalPagesProduct}
                >
                  Siguiente
                </button>
              </li>
            </ul>
          </nav>
</div>
  );
};



export default Productos;
