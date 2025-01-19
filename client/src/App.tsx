import { useState, useEffect } from 'react'
import ReactDOMServer from 'react-dom/server';
import { GoogleLogin} from '@react-oauth/google'
import toast, { Toaster } from 'react-hot-toast'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet } from '@fortawesome/free-solid-svg-icons';
import { faPizzaSlice } from '@fortawesome/free-solid-svg-icons';
import 'leaflet/dist/leaflet.css'

import './App.css'


function App() {
  const [token, setToken]: any = useState("")
  const [email, setEmail]: any = useState("")
  const [showMap, setShowMap]: any = useState(false)
  const [map, setMap]: any = useState(null)
  const [userLocation, setUserLocation]: any = useState(null)
  const [markers, setMarkers]: any = useState([])
  const [loadingToastId, setLoadingToastId]: any = useState("")

  const initialPosition: any  = { lat: 0, lng: 0 }

  // const server = "http://localhost:8080"
  const server = "https://mapis-production.up.railway.app"

  useEffect(() => {
    if (map) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            const userLocation = {lat: latitude, lng: longitude}
  
            // Move the map view and set the user's location
            map.flyTo(userLocation, 13)
            setUserLocation(userLocation)
          },
          (error) => {
            console.error("Geolocation error:", error)

            let errorMessage = ""
            switch (error.code) {
              case 1:
                errorMessage ="Permission denied. Please allow location access."
                break;
              case 2:
                errorMessage ="Position unavailable. Check your network or GPS."
                break;
              case 3:
                errorMessage ="Request timed out. Try again."
                break;
              default:
                errorMessage = "An unknown error occurred."
            }

            alert("Unable to fetch your location. " + errorMessage)
          }
        )
      }
      else
        alert("Geolocation is not supported by your browser.")
    }
  }, [map])

  useEffect(() => {
    if (token && email) {
      fetch(server+"/api/db/add_user", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
      })
      .then((res) => res.json())
      .then(async (_data) => {
        // console.log('db response:', _data, 'fetching markers...');

        await getUserMarkers(email)

        toast.success("Logged in!", {
          id: loadingToastId,
        });
      })
      .catch((error) => {
        console.error('Error:', error);
      });
      
    }
  }, [token, email])

  /*
  const FlyTo = ({lat, lng, zoom=13}: any) => {
    const handleClick = () => {
      map.flyTo({ lat: lat, lng: lng }, zoom)
    }

    return (
      <button
        onClick={handleClick}
        style={{
          position: "absolute",
          top: 10,
          left: 70,
          zIndex: 1000,
          backgroundColor: "white",
          padding: "10px",
          border: "1px solid gray",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Move to Location
      </button>
    )
  }
  */

  const pissIcon = L.divIcon({
    html: ReactDOMServer.renderToString(
      <FontAwesomeIcon icon={faDroplet} style={{ color: 'yellow', fontSize: '24px' }} />
    ),
    iconSize: [24, 24], // Adjust size if needed
    className: '' // Optional class for further styling
  });

  const foodIcon = L.divIcon({
    html: ReactDOMServer.renderToString(
      <FontAwesomeIcon icon={faPizzaSlice} style={{ color: 'orange', fontSize: '24px' }} />
    ),
    iconSize: [24, 24], // Adjust size if needed
    className: '' // Optional class for further styling
  });

  const getUserMarkers = async (email: string) => {
    fetch(server+"/api/db/get_user_markers", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email })
    })
    .then((res) => res.json())
    .then((data) => {
      // console.log('Backend response:', data)

      const markersList = []
      for (let marker of data.response)
        markersList.push({ type: marker.type, description: marker.description, position: { lat: marker.lat, lng: marker.lng }, date: marker.ts_creation })

      setMarkers(markersList)
      setShowMap(true)
    })
    .catch((error) => {
      console.error('Error:', error)
    })
  }

  const addMarker = async (type: string) => {
    const description = prompt("Add a description for this marker...");

    fetch(server+"/api/db/add_marker", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email, type: type, description: description, lat: userLocation.lat, lng: userLocation.lng })
    })
    .then((res) => res.json())
    .then((_data) => {
      // console.log('Backend response:', _data)

      setMarkers([...markers, { type: type, description: description, position: { lat: userLocation.lat, lng: userLocation.lng }, date: new Date().toLocaleString() }])

      toast.success("Marker added!")
    })
    .catch((error) => {
      console.error('Error:', error)
      toast.error("Error!")
    })
  }

  const handleLogin = (response: any) => {
    // console.log('Google login response:', response);

    const loadingToast = toast.loading("Loading...")

    setLoadingToastId(loadingToast)

    // Send the token to your Node.js backend for verification
    fetch(server+"/api/auth/login", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: response.credential })
    })
    .then((res) => res.json())
    .then((data) => {
      // console.log('Backend response:', data);

      setToken(data.token)
      setEmail(data.email)
    })
    .catch((error) => {
      console.error("Error:", error)
      toast.error("An error occured, try again later", {
        id: loadingToast,
      })
    })
  }

  const CurrentPosition = () => {
    const handleClick = () => {
      map.flyTo({ lat: userLocation.lat, lng: userLocation.lng }, 13)
    }

    return (
      <button
        onClick={handleClick}
        style={{
          position: "absolute",
          top: 10,
          left: 55,
          zIndex: 1000,
          padding: "10px",
          border: "1px solid gray",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Move to current location
      </button>
    )
  }

  /*
  const ZoomOut = () => {
    const handleClick = () => {
      map.setZoom(map.getZoom() - 1);
    }

    return (
      <button
        onClick={handleClick}
        style={{
          position: "absolute",
          top: 10,
          left: 230,
          zIndex: 1000,
          backgroundColor: "white",
          padding: "10px",
          border: "1px solid gray",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Zoom out
      </button>
    )
  }
  */

  const AddPissMarker = () => {
    return (
      <button
        onClick={() => addMarker("piss")}
        style={{
          position: "absolute",
          top: 10,
          left: 225,
          zIndex: 1000,
          padding: "10px",
          border: "1px solid gray",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Piss
      </button>
    )
  }

  const AddFoodMarker = () => {
    return (
      <button
        onClick={() => addMarker("food")}
        style={{
          position: "absolute",
          top: 10,
          left: 280,
          zIndex: 1000,
          padding: "10px",
          border: "1px solid gray",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Food
      </button>
    )
  }

  const MapPlaceholder = () => {
    return (
      <p>
        <noscript>You need to enable JavaScript to see this map.</noscript>
      </p>
    )
  }

  const getGoogleMapsDirections = (lat: number, lng: number) => {
    // const url = `https://www.google.com/maps?q=${lat},${lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}&travelmode=""`;
    window.open(url, '_blank'); // Open in a new tab
  };

  /*
  function ButtonControl({text}: any) {
    return (
        <div className={'leaflet-top leaflet-right'}>
          <div className="leaflet-control">
            <button type={"button"} onClick={() => alert("ao")}>{text}</button>
          </div>
        </div>
    )
  }
  */

  return (
    <div className='root'>
      <Toaster
        toastOptions={{
          // Define default options
          duration: 3750
        }}
      />

      {!showMap &&
        <div className='landingPage'>
          <h1>
            Mapis
          </h1>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '20vh' }}>
            <GoogleLogin
              onSuccess={handleLogin}
              onError={() => console.error('Login Failed')}
              useOneTap={false}
            />
          </div>
        </div>
      }

      {showMap &&
        <MapContainer
          center={initialPosition}
          zoom={13}
          scrollWheelZoom={true}
          ref={setMap}
          placeholder={<MapPlaceholder />}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {markers.map((marker: any, i: number) => {
            return (
              <Marker
                key={i}
                position={{lat: marker.position.lat, lng: marker.position.lng}}
                icon={marker.type === "piss" ? pissIcon : foodIcon}
              >
                <Popup>
                  <div>
                    {marker.description}
                    <button onClick={() => getGoogleMapsDirections(marker.position.lat, marker.position.lng)}>Get directions</button>
                  </div>
                </Popup>
              </Marker>
            )
          })
          }

          {/*
            <FlyTo 
              lat={10}
              lng={500}
            />
          */}

          {/* <ZoomOut /> */}
          <CurrentPosition />
          <AddPissMarker />
          <AddFoodMarker />
          
          {/*
            <ButtonControl text={"Add piss marker"}/>
            <ButtonControl text={"Add food marker"}/>
          */}

          <MapPlaceholder />
        </MapContainer>
      }
    </div>
  )
}

export default App;