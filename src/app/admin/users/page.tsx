'use client';

import { useState, useEffect } from 'react';
import { userService, type User, type CreateUserRequest, type UpdateUserRequest } from '@/services/userService';
import { AuthService } from '@/services/authService';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    email: '',
    name: '',
    password: '',
    role: 'ADMIN'
  });

  useEffect(() => {
    // Limpiar tokens inválidos al cargar la página
    AuthService.clearInvalidTokens();
    
    // Verificar autenticación antes de cargar usuarios
    if (!AuthService.isAuthenticated()) {
      setError('Debes estar autenticado para acceder a esta página');
      setLoading(false);
      return;
    }
    
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar autenticación antes de la petición
      if (!AuthService.isAuthenticated()) {
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      
      const data = await userService.getAllUsers();
      console.log('Usuarios recibidos:', data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading users:', err);
      
      // Manejar específicamente errores de autenticación
      if (err.message?.includes('sesión') || err.message?.includes('expirado') || err.message?.includes('autenticación')) {
        setError(err.message);
        // La redirección se maneja automáticamente en userService
      } else {
        setError('Error al cargar los usuarios');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!AuthService.isAuthenticated()) {
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      
      const newUser = await userService.createUser(formData);
      setUsers([...users, newUser]);
      setFormData({ username: '', email: '', name: '', password: '', role: 'ADMIN' });
      setIsCreateModalOpen(false); // Cerrar modal después de crear exitosamente
    } catch (err: any) {
      if (err.message?.includes('sesión') || err.message?.includes('expirado')) {
        setError(err.message);
      } else {
        setError('Error al crear el usuario');
      }
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    
    try {
      if (!AuthService.isAuthenticated()) {
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      
      const updateData: UpdateUserRequest = {
        username: selectedUser.username,
        email: selectedUser.email,
        name: selectedUser.name,
        role: selectedUser.role,
        is_active: selectedUser.is_active
      };
      
      const updatedUser = await userService.updateUser(selectedUser.user_id, updateData);
      setUsers(users.map(user => 
        user.user_id === selectedUser.user_id ? updatedUser : user
      ));
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      if (err.message?.includes('sesión') || err.message?.includes('expirado')) {
        setError(err.message);
      } else {
        setError('Error al actualizar el usuario');
      }
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      if (!AuthService.isAuthenticated()) {
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      
      await userService.deleteUser(userToDelete);
      setUsers(users.filter(user => user.user_id !== userToDelete));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      if (err.message?.includes('sesión') || err.message?.includes('expirado')) {
        setError(err.message);
      } else {
        setError('Error al eliminar el usuario');
      }
      console.error(err);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDetail = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const confirmDelete = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteModalOpen(true);
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      if (!AuthService.isAuthenticated()) {
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      
      // El backend no tiene endpoint específico para toggle, usamos update
      const updatedUser = await userService.updateUser(userId, { is_active: isActive });
      setUsers(users.map(user => 
        user.user_id === userId ? updatedUser : user
      ));
    } catch (err: any) {
      if (err.message?.includes('sesión') || err.message?.includes('expirado')) {
        setError(err.message);
      } else {
        setError('Error al cambiar el estado del usuario');
      }
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Cargando usuarios...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 w-full max-w-full overflow-x-hidden min-h-full">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Gestión de Usuarios</h1>
            <p className="text-purple-200 text-sm md:text-base">Administra los usuarios del sistema</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Crear Usuario</span>
            </div>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl border border-white/20 overflow-hidden w-full">
        {!users || users.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            <div className="text-purple-200 text-lg">No hay usuarios registrados</div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
            <div className="min-w-[900px] lg:min-w-full">
              <table className="w-full table-fixed">
                <thead className="bg-white/10 border-b border-white/20">
                  <tr>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider whitespace-nowrap w-[120px]">
                      Documento
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider whitespace-nowrap w-[150px]">
                      Nombre
                    </th>
                    <th className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider whitespace-nowrap w-[200px]">
                      Email
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider whitespace-nowrap w-[80px]">
                      Rol
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider whitespace-nowrap w-[100px]">
                      Estado
                    </th>
                    <th className="hidden lg:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider whitespace-nowrap w-[180px]">
                      Fecha Creación
                    </th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider whitespace-nowrap w-[120px]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => (
                    <tr key={user.user_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap w-[120px]">
                        <div className="text-white font-medium text-sm md:text-base truncate" title={user.username}>
                          {user.username}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap w-[150px]">
                        <div className="text-purple-200 text-sm truncate" title={user.name || 'Sin nombre'}>
                          {user.name || 'Sin nombre'}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap w-[200px]">
                        <div className="text-purple-200 text-sm truncate" title={user.email}>
                          {user.email}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap w-[80px]">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'ADMIN' 
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                        }`}>
                          {user.role === 'ADMIN' ? 'Admin' : 'Oper'}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap w-[100px]">
                        <button
                          onClick={() => toggleUserStatus(user.user_id, !user.is_active)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                            user.is_active 
                              ? 'bg-green-500/20 text-green-400 border border-green-400/30 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-400/30 hover:bg-red-500/30'
                          }`}
                        >
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="hidden lg:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap w-[180px]">
                        <div className="text-purple-200 text-sm">
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap w-[120px]">
                        <div className="flex space-x-1 md:space-x-2">
                          <button
                            onClick={() => handleDetail(user)}
                            className="text-green-400 hover:text-green-300 transition-colors p-1"
                            title="Ver detalles"
                          >
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                            title="Editar usuario"
                          >
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => confirmDelete(user.user_id)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1"
                            title="Eliminar usuario"
                          >
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-auto border border-white/20 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Crear Nuevo Usuario</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-1 sm:mb-2">Documento</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Ingrese número de documento"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-1 sm:mb-2">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Ingrese nombre completo"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-1 sm:mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-1 sm:mb-2">Contraseña</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Ingrese contraseña"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-1 sm:mb-2">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'ADMIN' | 'OPERARIO'})}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="OPERARIO">Operario</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreate}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Crear Usuario
              </button>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setFormData({ username: '', email: '', name: '', password: '', role: 'ADMIN' });
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-auto border border-white/20 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Editar Usuario</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-1 sm:mb-2">Documento</label>
                <input
                  type="text"
                  value={selectedUser.username}
                  onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-1 sm:mb-2">Nombre Completo</label>
                <input
                  type="text"
                  value={selectedUser.name || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-1 sm:mb-2">Email</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-1 sm:mb-2">Rol</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value as 'ADMIN' | 'OPERARIO'})}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="OPERARIO">Operario</option>
                </select>
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-1 sm:mb-2">Estado</label>
                <select
                  value={selectedUser.is_active ? 'true' : 'false'}
                  onChange={(e) => setSelectedUser({...selectedUser, is_active: e.target.value === 'true'})}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-auto border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Detalles del Usuario</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-1">Documento</label>
                <div className="text-white font-medium text-sm sm:text-base">{selectedUser.username}</div>
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-1">Nombre Completo</label>
                <div className="text-white text-sm sm:text-base">{selectedUser.name || 'Sin nombre'}</div>
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-1">Email</label>
                <div className="text-white text-sm sm:text-base break-words">{selectedUser.email}</div>
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-1">Rol</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedUser.role === 'ADMIN' 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                }`}>
                  {selectedUser.role === 'ADMIN' ? 'Administrador' : 'Operario'}
                </span>
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-1">Estado</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedUser.is_active 
                    ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                    : 'bg-red-500/20 text-red-400 border border-red-400/30'
                }`}>
                  {selectedUser.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-1">Fecha de Creación</label>
                <div className="text-white text-sm sm:text-base">{formatDate(selectedUser.created_at)}</div>
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-1">Última Actualización</label>
                <div className="text-white text-sm sm:text-base">{formatDate(selectedUser.updated_at)}</div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-auto border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Eliminación</h3>
            <p className="text-purple-200 mb-6">
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Eliminar
              </button>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
