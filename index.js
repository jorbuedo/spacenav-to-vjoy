import hid from 'node-hid'
import vjoy from 'vjoy'

const { vJoy, vJoyDevice } = vjoy

const joinInt16 = (low, high) => {
  const sign = high & (1 << 7)
  const result = ((high & 0xff) << 8) | (low & 0xff)
  return sign ? (0xffff0000 | result) : result
}

const interpolate = n => {
  const input = Math.abs(n) > 75 ? n : 0
  return Math.max(1, Math.floor((input + 350) * 46.81))
}

const device = hid
  .devices()
  .find(d => d.product.includes('SpaceMouse'))

if (!device) {
  console.log('No device found')
  process.exit()
}


let spacenav = null
try {
  spacenav = new hid.HID(device.path)
} catch (err) {
  console.log('Can\'t open device: ', error)
  process.exit()
}

let vjoyId = 1;

if (process.argv.length > 2) {
	vjoyId = Number(process.argv[2]);
}

if (!vJoy.isEnabled()) {
	console.log("vJoy is not enabled.");
	process.exit();
}

let vjd = vJoyDevice.create(vjoyId);

if (vjd == null) {
	console.log(`Could not initialize the device. Status: ${vJoyDevice.status(vjoyId)}`);
	process.exit();
}

spacenav.on('data', data => {
  switch (data[0]) {
    case 1:
      vjd.axes.X.set(interpolate(joinInt16(data[1], data[2])));
      vjd.axes.Y.set(interpolate(joinInt16(data[3], data[4]) * -1));
      vjd.axes.Z.set(interpolate(joinInt16(data[5], data[6]) * -1));
      break
    case 2:
      vjd.axes.Rx.set(interpolate(joinInt16(data[1], data[2])));
      vjd.axes.Ry.set(interpolate(joinInt16(data[3], data[4]) * -1));
      vjd.axes.Rz.set(interpolate(joinInt16(data[5], data[6])));
      break
    case 3:
      vjd.buttons[1].set((1 & data[1]) > 0)
      vjd.buttons[2].set((2 & data[1]) > 0)
      break
  }
})