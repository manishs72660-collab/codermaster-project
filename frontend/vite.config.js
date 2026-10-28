import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/auth": "http://localhost:3000",
      "/problem": "http://localhost:3000",
      "/code": "http://localhost:3000",
      "/ai": "http://localhost:3000",
      "/video": "http://localhost:3000",
      "/duel": "http://localhost:3000",
      "/contest": "http://localhost:3000",
      "/api": "http://localhost:3000",
      "/chat": "http://localhost:3000",
      "/solution": "http://localhost:3000",
      "/collage": "http://localhost:3000",
      "/profile": "http://localhost:3000",
      "/community": "http://localhost:3000",
      "/discuss": "http://localhost:3000",
      "/mcq-contest": "http://localhost:3000",
      "/design": "http://localhost:3000",
      "/designprolem": "http://localhost:3000",
      "/compiler": "http://localhost:3000",
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
      },
    },
  },
})
