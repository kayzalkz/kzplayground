import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',timeout:90000,fullyParallel:false,workers:1,retries:0,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:5173',trace:'retain-on-failure',screenshot:'only-on-failure',launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}},
  projects:[{name:'desktop-chromium',use:{...devices['Desktop Chrome']}},{name:'android-chromium',use:{...devices['Pixel 7']}}],
  webServer:{command:'npm run dev -- --port 5173 --strictPort',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI,timeout:90000}
});
