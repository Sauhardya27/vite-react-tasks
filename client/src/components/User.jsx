import React, { useState, useEffect } from 'react';
import axios from 'axios';

const User = () => {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/users');
            setUsers(response.data);
        } catch (error) {
            setError('Error fetching users: ' + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`http://localhost:3000/api/users/${editingId}`, formData);
                setSuccess('User updated successfully!');
            } else {
                await axios.post('http://localhost:3000/api/users', formData);
                setSuccess('User created successfully!');
            }
            
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                address: ''
            });
            setEditingId(null);
            fetchUsers();
        } catch (error) {
            setError(error.response?.data?.message || error.message);
        }
    };

    const handleEdit = (user) => {
        setFormData({
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            address: user.address
        });
        setEditingId(user._id);
        setError(null);
        setSuccess(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`http://localhost:3000/api/users/${id}`);
                setSuccess('User deleted successfully!');
                fetchUsers();
            } catch (error) {
                setError('Error deleting user: ' + error.message);
            }
        }
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 my-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-6">
                User Management
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
                >
                    {editingId ? 'Update User' : 'Create User'}
                </button>
            </form>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                    {success}
                </div>
            )}

            {/* Users List */}
            <div className="space-y-4">
                {users.map((user) => (
                    <div key={user._id} className="p-4 bg-white rounded-lg shadow border">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg">{user.fullName}</h3>
                                <p className="text-gray-600">{user.email}</p>
                                <p className="text-gray-600">{user.phone}</p>
                                <p className="text-gray-600">{user.address}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(user._id)}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default User;