// src/components/VirtualGallery.jsx
import React, { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { room1Hotspots, room2Hotspots, room3Hotspots } from "./data/hotspots";
import { createRoomTitle } from "./ui/RoomTitle";
import { createLoadingOverlay } from "./ui/LoadingOverlay";
import { createArtifactModal } from "./ui/ArtifactModal";
import { createTooltip } from "./ui/Tooltip";
import MiniMap from "./ui/MiniMap"; 
import { videoModal } from "./ui/videoModal";


// Background music for each room
// Audio setup
    const audios = [
      new Audio("/assets/background1.mp3"),
      new Audio("/assets/background2.mp3"),
      new Audio("/assets/background3.mp3"),
    ];
function playMusicForRoom(room) {
  // Stop all music first
  Object.values(roomMusic).forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });

  // Play selected room music
  if (roomMusic[room]) {
    roomMusic[room].loop = true;
    roomMusic[room].volume = 0.5; // adjust volume
    roomMusic[room].play();
  }
}
let artifactAudio = null; 
let descriptionAudio = null;
const roomIndexMap = { room1: 1, room2: 2, room3: 3 }; // for resuming bg music


export default function VirtualGallery() {
  const [currentRoom, setCurrentRoom] = React.useState("room1");

  useEffect(() => {
    let scene, camera, renderer, controls;
    let sphere, raycaster, mouse;
    let hotspotMeshes = [];

    const tooltip = createTooltip();

    //  Setup audios
    audios.forEach((audio) => {
      audio.loop = true;
      audio.volume = 0;
    });

    function fadeVolume(audio, target, duration = 1000) {
      const start = audio.volume;
      const change = target - start;
      const startTime = Date.now();

      function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        audio.volume = Math.max(0, Math.min(1, start + change * progress));
        if (progress < 1) requestAnimationFrame(animate);
      }
      animate();
    }

    function playMusicForRoom(roomIndex) {
      audios.forEach((audio, i) => {
        if (i === roomIndex - 1) {
          if (audio.paused) audio.play();
          fadeVolume(audio, 0.5, 2000);
        } else {
          fadeVolume(audio, 0, 2000);
        }
      });
    }

    //  UI Elements
    const roomTitle = createRoomTitle();
    const loadingOverlay = createLoadingOverlay();
    const { modal, modalImg, modalTitle, modalDesc, closeBtn, audioDescBtn } = createArtifactModal();
    const { modal: vidModal, videoEl, titleEl } = videoModal();
    //  Global Mute Button
    const muteBtn = document.createElement("button");
    muteBtn.innerText = "🔊"; // start as unmuted
    muteBtn.style.position = "fixed";
    muteBtn.style.top = "20px";
    muteBtn.style.right = "20px";
    muteBtn.style.zIndex = 3000;
    muteBtn.style.padding = "10px 15px";
    muteBtn.style.fontSize = "20px";
    muteBtn.style.cursor = "pointer";
    document.body.appendChild(muteBtn);

    let isMuted = false;

    muteBtn.onclick = () => {
      isMuted = !isMuted;

  // Toggle all room music volumes
  audios.forEach(audio => {
    audio.muted = isMuted;
  });

  // Also mute artifact audio if playing
  if (artifactAudio) artifactAudio.muted = isMuted;

  // Update button icon
  muteBtn.innerText = isMuted ? "🔇" : "🔊";
};


    closeBtn.onclick = () => {
  modal.style.display = "none";

  if (artifactAudio) {
    artifactAudio.pause();
    artifactAudio.currentTime = 0;
    artifactAudio = null;
  }
  if (descriptionAudio) {
    descriptionAudio.pause();
    descriptionAudio.currentTime = 0;
    descriptionAudio = null;
  }

  const idx = roomIndexMap["room2"];
  if (idx) playMusicForRoom(idx);
};

    // Scene Setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0.1);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    const container = document.getElementById("gallery-container");
    if (container) {
      container.appendChild(renderer.domElement);
}
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    const loader = new THREE.TextureLoader();

    function loadPanorama(path, callback) {
      loadingOverlay.style.display = "flex";
      loader.load(
        path,
        (texture) => {
          //creates the sphere where the texture loads
          if (!sphere) {
            const geometry = new THREE.SphereGeometry(400, 60, 40);
            //set to negative one so the image will flips the sphere inside out 
            geometry.scale(-1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ map: texture });
            sphere = new THREE.Mesh(geometry, material);
            scene.add(sphere);
  

          } else {
            sphere.material.map = texture;
            sphere.material.needsUpdate = true;
          }
          loadingOverlay.style.opacity = "0";
          setTimeout(() => {
            loadingOverlay.style.display = "none";
            loadingOverlay.style.opacity = "1";
          }, 500);
          if (callback) callback();
        },
        undefined,
        (err) => {
          console.error("Failed to load panorama", err);
        }
      );
    }

    function clearHotspots() {
      hotspotMeshes.forEach((mesh) => scene.remove(mesh));
      hotspotMeshes = [];
    }

function addHotspots(hotspots) {
  hotspots.forEach((spot) => {
    if (spot.type === "artifact") {
      createInfoHotspot(spot.position.x, spot.position.y, spot.position.z, spot);
    } else if (spot.type === "navigation") {
      createNavigationHotspot(spot.position.x, spot.position.y, spot.position.z, spot.action, spot.title);
    }
    else if (spot.type === "video") {
      createVideoHotspot(spot.position.x, spot.position.y, spot.position.z, spot.video);
    }
  });
}
   function createNavigationHotspot(x, y, z, onClick) {
  const geometry = new THREE.ConeGeometry(3, 8, 4); // triangle
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // green
  const cone = new THREE.Mesh(geometry, material);

  cone.position.set(x, y, z);
  cone.rotation.x = Math.PI; // points down
  cone.userData = { type: "navigation", action: onClick };
  

  scene.add(cone);
  hotspotMeshes.push(cone);
}
function createVideoHotspot(x, y, z, videoPath) {
  const textureLoader = new THREE.TextureLoader();
  const spriteMap = textureLoader.load("/assets/video_icon.png"); // 🎥 use video icon
  const spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap });
  const sprite = new THREE.Sprite(spriteMaterial);

  sprite.position.set(x, y, z);
  sprite.scale.set(15, 15, 1);
  sprite.userData = { type: "video", video: videoPath };

  scene.add(sprite);
  hotspotMeshes.push(sprite);}

function createInfoHotspot(x, y, z, data) {
  const textureLoader = new THREE.TextureLoader();
  const spriteMap = textureLoader.load("/assets/exclamation.png"); 
  const spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap });
  const sprite = new THREE.Sprite(spriteMaterial);

  sprite.position.set(x, y, z);
  sprite.scale.set(15, 15, 1);
  sprite.userData = { type: "artifact", ...data };

  scene.add(sprite);
  hotspotMeshes.push(sprite);

  // --- Glow only for artifacts ---
  if (data && data.type === "artifact") {
    const glowGeo = new THREE.SphereGeometry(6, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.0,   // start invisible
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(sprite.position);
    scene.add(glow);

    // Attach glow to sprite for easy control
    sprite.userData.glow = glow;
  }
}


function switchRoom(room) {
      clearHotspots();
      if (room === "room1") {
        
    //room1
    roomTitle.style.display = "block";
        setTimeout(() => {
         roomTitle.style.opacity = 1;
    }, 50);
        loadPanorama("/assets/room1.jpg", () => addHotspots(room1Hotspots));
        playMusicForRoom(1);
      } else if (room === "room2") {
        loadPanorama("/assets/room2.jpg", () => addHotspots(room2Hotspots));
        playMusicForRoom(2);
      } else if (room === "room3") {
        loadPanorama("/assets/room3.jpg", () => addHotspots(room3Hotspots));
        playMusicForRoom(3);
      }

      setCurrentRoom(room); //  update React state
    }
  


    //  Interaction
    function onMouseMove(event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
       raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObjects(hotspotMeshes, true);

if (intersects.length > 0) {
  const obj = intersects[0].object;
  const data = obj.userData || {};

  if (["navigation", "artifact", "video"].includes(data.type)) {
    // Show tooltip
    tooltip.show(
      data.title || (data.type === "video" ? "Play Video" : "Enter"),
      event.clientX + 20,
      event.clientY + 20
    );

    // --- Artifact glow handling ---
    hotspotMeshes.forEach(mesh => {
      if (mesh.userData.type === "artifact" && mesh.userData.glow) {
        if (mesh === obj) {
         if (mesh === obj) {
  // Distance-based scaling → keeps glow same size on screen
  const distance = camera.position.distanceTo(mesh.position);
  const scaleFactor = distance * 0.01; // tweak to adjust glow
  mesh.userData.glow.scale.set(scaleFactor, scaleFactor, scaleFactor);

  // Pulsing opacity
  const pulse = 0.2 + 0.2 * Math.sin(Date.now() * 0.005);
  mesh.userData.glow.material.opacity = Math.min(0.4 + pulse, 0.6);

} else {
  // Not hovered → fade out
  mesh.userData.glow.material.opacity = Math.max(
    mesh.userData.glow.material.opacity - 0.05,
    0.0
  );
}

     } else {
         // Not hovered → fade out
       mesh.userData.glow.material.opacity = Math.max(
        mesh.userData.glow.material.opacity - 0.05,
          0.0
          );
        }
      }
    });

    return;
  }
}
tooltip.hide();

hotspotMeshes.forEach(mesh => {
  if (mesh.userData.type === "artifact" || "video" && mesh.userData.glow) {
    mesh.userData.glow.material.opacity = Math.max(
      mesh.userData.glow.material.opacity - 0.05,
      0.0
    );
  }
});
    }
  function onClick() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(hotspotMeshes);

  if (intersects.length > 0) {
    const hotspot = intersects[0].object.userData;
  
 if (hotspot.type === "video") {
    vidModal.style.display = "flex";//show modal
    videoEl.src = hotspot.video;//set video source
    videoEl.play();

    // Pause background music
    audios.forEach(a => a && a.pause());
  }


if (hotspot.type === "artifact") {
  modal.style.display = "flex";
  modalImg.src = hotspot.image;
  modalTitle.innerText = hotspot.title || "";

  // fade-in description
  modalDesc.innerText = hotspot.description || "";
  modalDesc.style.opacity = 0; // start invisible
  modalDesc.style.transition = "opacity 7s ease-in-out";
  
  // trigger fade
  requestAnimationFrame(() => {
    modalDesc.style.opacity = 1;
  });

  // pause background music
  audios.forEach(a => a && a.pause());

  // play artifact music
  if (artifactAudio) {
    artifactAudio.pause();
    artifactAudio = null;
  }
  if (hotspot.music) {
    artifactAudio = new Audio(hotspot.music);
    artifactAudio.loop = true;
    artifactAudio.volume = 0.8;
    artifactAudio.play();
  }

  // audio description button
  if (hotspot.audioDescription) {
    closeBtn.style.display = "block";
    audioDescBtn.style.display = "inline-block";

    audioDescBtn.onclick = () => {
      if (descriptionAudio && !descriptionAudio.paused) {
        descriptionAudio.pause();
        descriptionAudio.currentTime = 0;
        descriptionAudio = null;
        artifactAudio.volume = 0.8;
        audioDescBtn.innerText = "Play Audio Description";
      } else {
        if (artifactAudio) artifactAudio.volume = 0.4;

        descriptionAudio = new Audio(hotspot.audioDescription);
        descriptionAudio.volume = 1.0;
        descriptionAudio.play();
        audioDescBtn.innerText = "Stop Audio Description";

        descriptionAudio.onended = () => {
          if (artifactAudio) artifactAudio.volume = 0.8;
          descriptionAudio = null;
          audioDescBtn.innerText = "Play Audio Description";
        };
      }
    };
  } else {
    audioDescBtn.style.display = "none";
  }

} 
    else if (hotspot.type === "navigation") {
      switchRoom(hotspot.action);
    }
  }
  
}
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);

    
    //  Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      
      raycaster.setFromCamera(mouse, camera);
      
    // Floating and glowing effect for navigation arrows
  const time = Date.now() * 0.002;
  hotspotMeshes.forEach(mesh => {
   if (mesh.geometry && mesh.geometry.type === "ConeGeometry") {
   const colorShift = (Math.sin(Date.now() * 0.005) + 1) / 2; // 0 → 1
    mesh.material.color.setHSL(0.33, 1, 0.5 + 0.2 * colorShift) // green → yellow
    mesh.position.y += Math.sin(time) * 0.10;
  }
    if (mesh.type === "Sprite") {
      const scaleFactor = 10; // Adjust size (smaller or bigger)
      const distance = camera.position.distanceTo(mesh.position);

      const pulse = 1 + 0.06 * Math.sin(Date.now()* 0.005);
      mesh.scale.set(scaleFactor * distance * .01, scaleFactor * distance * .01 * pulse, .01);
    }
});

      renderer.render(scene, camera);
    }

    // Start scene
    switchRoom("room1");
    animate();

     return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("click", onClick);

    if (renderer) {
      const container = document.getElementById("gallery-container");
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    }
  };
}, []); // <-- end of useEffect

  // React JSX return
  return (
    <>
      <div id="gallery-container"></div>
      { }
      <MiniMap currentRoom={currentRoom} onRoomChange={(room) => setCurrentRoom(room)} />
    </>
  );
}
