// 1. run mongo db
// docker run -p 27023:27017 -v D:\Documents\react_learning\c2_g2:/data/db -d mongo:latest
// 2. run backend
// cd D:\Documents\react_learning\c2_g2\backend
// npm start
// 3. run frontend
// cd D:\Documents\react_learning\c2_g2\frontend
// npm start
// admin1, 1
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Polygon,
  ZoomControl,
  useMapEvents,
  Marker,
} from "react-leaflet";
import Button from "./components/ui/Button";
import Input from "./components/ui/Input";
import "./App.css";
import g2logo from "./g2logo.png";
import L from "leaflet";
import { PiDroneBold } from "react-icons/pi";
import ReactDOMServer from "react-dom/server";

const socket = io("http://localhost:5000");

const customDroneIcon = L.divIcon({
  className: "custom-drone-icon",
  html: ReactDOMServer.renderToString(
    <PiDroneBold style={{ color: "#ffff00", fontSize: "24px" }} />
  ),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
  });
  return null;
}

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [detections, setDetections] = useState([]);
  const [isAddingPolygon, setIsAddingPolygon] = useState(false);
  const [polygonCoordinates, setPolygonCoordinates] = useState([]);
  const [polygons, setPolygons] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMissionActive, setIsMissionActive] = useState(false);
  const [wanderingPoints, setWanderingPoints] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [showSensors, setShowSensors] = useState(false);

  useEffect(() => {
    socket.on("detections", (data) => {
      setDetections(data);
    });

    socket.on("sensors", (data) => {
      setSensors(data);
    });

    return () => {
      socket.off("detections");
    };
  }, []);

  const handleLogin = async () => {
    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (response.ok) setLoggedIn(true);
  };

  const handleAddPolygon = () => {
    setIsDrawing(true);
    setPolygonCoordinates([]);
  };

  const handleMapClick = (e) => {
    if (isDrawing) {
      const newCoord = [e.latlng.lat, e.latlng.lng];
      setPolygonCoordinates((prev) => [...prev, newCoord]);
    }
  };

  const handleStopPolygon = () => {
    if (polygonCoordinates.length >= 3) {
      setPolygons([...polygons, polygonCoordinates]);
    }
    setIsDrawing(false);
  };

  const handleStartMission = () => {
    setIsMissionActive(!isMissionActive);
  };

  const getRandomPointInPolygon = (polygon) => {
    const bounds = polygon.reduce(
      (acc, point) => ({
        minLat: Math.min(acc.minLat, point[0]),
        maxLat: Math.max(acc.maxLat, point[0]),
        minLng: Math.min(acc.minLng, point[1]),
        maxLng: Math.max(acc.maxLng, point[1]),
      }),
      {
        minLat: Infinity,
        maxLat: -Infinity,
        minLng: Infinity,
        maxLng: -Infinity,
      }
    );

    const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
    const lng = bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng);

    return [lat, lng];
  };

  useEffect(() => {
    let interval;
    if (isMissionActive && polygons.length > 0) {
      if (wanderingPoints.length === 0) {
        const initialPoints = polygons.map((polygon) => ({
          position: getRandomPointInPolygon(polygon),
          polygonIndex: polygons.indexOf(polygon),
        }));
        setWanderingPoints(initialPoints);
      }

      interval = setInterval(() => {
        setWanderingPoints((currentPoints) =>
          currentPoints.map((point) => ({
            position: getRandomPointInPolygon(polygons[point.polygonIndex]),
            polygonIndex: point.polygonIndex,
          }))
        );
      }, 4000);
    } else {
      setWanderingPoints([]);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMissionActive, polygons]);

  // Add helper function to format coordinates
  const formatCoordinate = (coord) => {
    return `${coord[0].toFixed(6)}°, ${coord[1].toFixed(6)}°`;
  };

  const handleShowSensors = () => {
    setShowSensors(!showSensors);
    socket.emit("fetchSensors");
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white">
      {!loggedIn ? (
        <div className="login-container flex justify-center items-center h-full">
          <div className="login-form p-8 bg-gray-800 rounded-lg shadow-lg space-y-4">
            <img src={g2logo} alt="G2 Logo" className="login-logo mb-4" />
            <h2 className="login-title text-2xl font-bold mb-4">Login</h2>
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="login-buttons">
              <Button onClick={handleLogin}>Login</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full">
          <div className="sidebar w-1/4 flex flex-col">
            <div className="card mb-4">
              <h3 className="text-xl font-bold mb-2">Mission Control</h3>
              <div className="mission-buttons">
                <Button
                  onClick={handleStartMission}
                  className={isMissionActive ? "bg-red-600" : "bg-green-600"}
                >
                  {isMissionActive ? "STOP MISSION" : "START MISSION"}
                </Button>
              </div>
            </div>

            {/* Add new Platforms card */}
            {isMissionActive && wanderingPoints.length > 0 && (
              <div className="card mb-4">
                <h3 className="text-xl font-bold mb-2">Platforms</h3>
                <div className="platforms-list">
                  {wanderingPoints.map((point, index) => (
                    <div key={index} className="platform-item">
                      <div className="platform-header">
                        <PiDroneBold className="text-yellow-400" />
                        <span className="font-bold ml-2">
                          Drone {index + 1}
                        </span>
                      </div>
                      <div className="platform-coordinates">
                        {formatCoordinate(point.position)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card mb-4">
              <h3 className="text-xl font-bold mb-2">Polygons</h3>
              <div className="polygon-buttons">
                <Button onClick={handleAddPolygon} disabled={isDrawing}>
                  ADD POLYGON
                </Button>
                <Button
                  onClick={handleStopPolygon}
                  disabled={!isDrawing || polygonCoordinates.length < 3}
                >
                  STOP POLYGON
                </Button>
              </div>
            </div>

            {/* New Tracks card */}
            <div className="card mb-4">
              <h3 className="text-xl font-bold mb-2">Tracks</h3>
              <div className="tracks-buttons">
                <Button onClick={() => {}}>SHOW TRACKS</Button>
              </div>
            </div>

            <div className="card mb-4">
              <h3 className="text-xl font-bold mb-2">Sensors</h3>
              <div className="sensor-buttons">
                <Button onClick={handleShowSensors}>
                  {showSensors ? "HIDE SENSORS" : "SHOW SENSORS"}
                </Button>
              </div>
              {showSensors && (
                <div className="sensors-list">
                  {sensors.map((sensor) => (
                    <div key={sensor._id} className="sensor-item">
                      <span>{sensor.name}</span>
                      <span className="ml-2">Status: {sensor.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Videos card */}
            <div className="card mb-4">
              <h3 className="text-xl font-bold mb-2">Videos</h3>
              <div className="video-buttons">
                <Button onClick={() => {}}>SHOW VIDEOS</Button>
              </div>
            </div>

            {/* New Q&A card */}
            <div className="card mb-4">
              <h3 className="text-xl font-bold mb-2">Q&A</h3>
              <div className="qa-buttons">
                <Button onClick={() => {}}>PROMPT INTERFACE</Button>
              </div>
            </div>

            <ul>
              {detections.map((d, i) => (
                <li key={i}>{d.name}</li>
              ))}
            </ul>
          </div>
          <div className="map-container-wrapper w-3/4 relative">
            <nav className="navbar flex justify-between items-center">
              {/* Left section - G2 name */}
              <div className="w-1/3">
                <span className="text-xl font-bold pl-4">G2</span>
              </div>

              {/* Middle section - empty for balance */}
              <div className="w-1/3 flex justify-center"></div>

              {/* Right section - existing items */}
              <div className="w-1/3 flex justify-end">
                <span className="navbar-item">{username}</span>
                <span className="navbar-separator">|</span>
                <span className="navbar-item">
                  {new Date().toLocaleDateString()}
                </span>
                <span className="navbar-separator">|</span>
                <span className="navbar-item">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </nav>
            <MapContainer
              center={[51.505, -0.09]}
              zoom={15}
              className="map-container"
            >
              <MapClickHandler onMapClick={handleMapClick} />
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              {polygons.map((coords, index) => (
                <Polygon
                  key={index}
                  positions={coords}
                  color="yellow" // Changed from blue for better visibility
                  weight={2} // Increased line weight
                  opacity={0.8} // Slightly transparent
                  fillOpacity={0.2} // Very transparent fill
                />
              ))}
              {polygonCoordinates.length > 0 && (
                <Polygon
                  positions={polygonCoordinates}
                  color="red"
                  weight={2}
                  opacity={0.8}
                  fillOpacity={0.2}
                />
              )}
              {wanderingPoints.map((point, index) => (
                <Marker
                  key={index}
                  position={point.position}
                  icon={customDroneIcon}
                  rotationAngle={Math.random() * 360} // Optional: random rotation for more dynamic appearance
                />
              ))}
              <ZoomControl position="bottomright" />
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
