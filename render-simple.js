const { Canvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function renderRoom2D(width = 1920, height = 1080) {
  console.log('Creating 2D room visualization...');
  
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const ROOM_BG_COLOR = '#d8e2f0';
  const CUBE_COLOR = '#8b5cf6';
  const WALL_COLOR = '#ffffff';
  const FLOOR_COLOR = '#f0f0f0';
  
  ctx.fillStyle = ROOM_BG_COLOR;
  ctx.fillRect(0, 0, width, height);
  
  ctx.fillStyle = FLOOR_COLOR;
  ctx.fillRect(0, height * 0.7, width, height * 0.3);
  
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = 20;
  ctx.strokeRect(50, 50, width - 100, height - 200);
  
  ctx.fillStyle = CUBE_COLOR;
  ctx.fillRect(width / 2 - 50, height / 2 - 50, 100, 100);
  
  ctx.fillStyle = '#000000';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('3D Room', width / 2, 100);
  
  ctx.font = '24px Arial';
  ctx.fillText('Rendered with Canvas', width / 2, height - 100);
  
  const buffer = canvas.toBuffer('image/png');
  
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const screenshotPath = path.join(screenshotDir, 'room-2d-render.png');
  fs.writeFileSync(screenshotPath, buffer);
  
  console.log(`2D room render saved to: ${screenshotPath}`);
  console.log(`Image size: ${(buffer.length / 1024).toFixed(2)} KB`);
  
  return screenshotPath;
}

function renderRoomWithItems(items = [], width = 1920, height = 1080) {
  console.log('Rendering room with items:', items);
  
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const ROOM_BG_COLOR = '#d8e2f0';
  const CUBE_COLOR = '#8b5cf6';
  const WALL_COLOR = '#ffffff';
  const FLOOR_COLOR = '#f0f0f0';
  
  ctx.fillStyle = ROOM_BG_COLOR;
  ctx.fillRect(0, 0, width, height);
  
  ctx.fillStyle = FLOOR_COLOR;
  ctx.fillRect(0, height * 0.7, width, height * 0.3);
  
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = 20;
  ctx.strokeRect(50, 50, width - 100, height - 200);
  
  ctx.fillStyle = CUBE_COLOR;
  ctx.fillRect(width / 2 - 50, height / 2 - 50, 100, 100);
  
  const itemColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
  const itemPositions = [
    { x: width * 0.3, y: height * 0.8 },
    { x: width * 0.7, y: height * 0.8 },
    { x: width * 0.3, y: height * 0.6 },
    { x: width * 0.7, y: height * 0.6 },
    { x: width * 0.5, y: height * 0.9 },
  ];
  
  for (let i = 0; i < Math.min(items.length, itemPositions.length); i++) {
    ctx.fillStyle = itemColors[i % itemColors.length];
    ctx.beginPath();
    ctx.arc(itemPositions[i].x, itemPositions[i].y, 30, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(items[i], itemPositions[i].x, itemPositions[i].y + 5);
  }
  
  ctx.fillStyle = '#000000';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('3D Room with Items', width / 2, 100);
  
  const buffer = canvas.toBuffer('image/png');
  
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(screenshotDir, `room-items-${items.join('-')}-${timestamp}.png`);
  fs.writeFileSync(screenshotPath, buffer);
  
  console.log(`Room with items saved to: ${screenshotPath}`);
  
  return screenshotPath;
}

module.exports = {
  renderRoom2D,
  renderRoomWithItems,
};

if (require.main === module) {
  renderRoom2D();
  console.log('2D rendering complete!');
}
