import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Footer = () => {
  const [locationDetails, setLocationDetails] = useState({
    city: 'Fetching...',
    country: 'Fetching...',
    pincode: 'Fetching...',
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await axios.get(
            `https://maps.devsecit.com/introduce?lat=${latitude}&lon=${longitude}`
          );
          setLocationDetails({
            city: response.data.city || 'Not available',
            country: response.data.country || 'Not available',
            pincode: response.data.pincode || 'Not available',
          });
        } catch {
          setError('Failed to fetch location details.');
        }
      },
      (err) => {
        const errorMessages = {
          1: 'Location permission denied.',
          2: 'Location unavailable.',
          3: 'Location request timed out.',
        };
        setError(errorMessages[err.code] || 'Failed to get location.');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  return (
    <div className="w-full bg-white/80 backdrop-blur-sm shadow-lg border-t border-white/20 p-4">
      <div className="max-w-3xl mx-auto text-center">
        {error ? (
          <div className="text-red-600">
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-600 text-lg font-bold block">City</span>
              <span className="font-medium">{locationDetails.city}</span>
            </div>
            <div>
              <span className="text-gray-600 text-lg font-bold block">Country</span>
              <span className="font-medium">{locationDetails.country}</span>
            </div>
            <div>
              <span className="text-gray-600 text-lg font-bold block">Pincode</span>
              <span className="font-medium">{locationDetails.pincode}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Footer;