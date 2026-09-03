import axios from "axios";

// For Expo Web
const API_URL = "http://127.0.0.1:8000";

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const response = await axios.post(
    `${API_URL}/auth/register`,
    data
  );

  return response.data;
};

export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  console.log("Sending login request:", data);

  const response = await axios.post(
    `${API_URL}/auth/login`,
    data
  );

  return response.data;
};

export const getUserProfile = async (userId: number) => {
  const response = await axios.get(
    `${API_URL}/auth/users/${userId}`
  );

  return response.data;
};

export const updateUserProfile = async (
  userId: number,
  data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  }
) => {
  const response = await axios.put(
    `${API_URL}/auth/users/${userId}`,
    data
  );

  return response.data;
};

export const forgotPasswordUser = async (data: {
  email: string;
  new_password: string;
}) => {
  const response = await axios.post(
    `${API_URL}/auth/forgot-password`,
    data
  );
  return response.data;
};
