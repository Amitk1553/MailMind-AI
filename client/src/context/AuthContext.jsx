import React, { createContext, useState, useContext, useEffect } from 'react';
const AuthContext = React.createContext(); // parent se children mein data pass karne ke liye context ka use hota hai

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => { // pure app ko authentication ke liye wrap karne ke liye AuthProvider ka use hota hai
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true); // Initially set loading to true until we check localStorage

  useEffect(() => { // useEffect will see the value in localStorage and set the user state accordingly
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch (error) {
        console.error("Error parsing user info:", error);
        localStorage.removeItem("userInfo"); // Remove corrupted data
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => { // userData will contain the user info and token from the backend after successful login
    localStorage.setItem("userInfo", JSON.stringify(userData)); // Store the user info in localStorage, localStorage browser mein data store karne ke liye use hota hai, aur ye data tab tak rahega jab tak user manually remove nahi karega ya browser clear nahi karega,
    // we can use redux or context api to manage the user state in the app, but for now we are using localStorage to persist the user state across page reloads
    localStorage.setItem("token", userData.token); // Store the token in localStorage
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token"); // Remove the token from localStorage
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
