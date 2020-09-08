const express = require("express");
const bodyParser = require("body-parser");
const getDrugStoreByLocation = require("./utils");
// ... app code here

// Import the appropriate service and chosen wrappers
const {
  dialogflow,
  Permission,
  BrowseCarouselItem,
  SimpleResponse,
  BrowseCarousel
} = require("actions-on-google");

// Create an app instance
// const app = actionssdk();
const app = dialogflow();

// Register handlers for Actions SDK intents
// app.intent("Default Welcome Intent", (conv) => {
//   conv.ask("How are you?");
// });

app.intent(["Default Welcome Intent", "where to buy"], (conv) => {
  console.log("where to buy");
  return conv.ask(
    new Permission({
      context: "因為要查附近健保藥局的資訊",
      permissions: "DEVICE_PRECISE_LOCATION"
    })
  );
});
app.intent("handle_permission", async (conv, params, permissionGranted) => {
  console.log("handle_permission", permissionGranted, conv.data);
  if (!permissionGranted) {
    conv.close("使用者不同意");
  }
  let { longitude, latitude } = conv.device.location.coordinates;
  let ary = await getDrugStoreByLocation(longitude, latitude);
  console.log(ary);
  // conv.ask("get data" + ary);
  response(conv, ary);
});

const response = (conv, list) => {
  let t =
    list.length === 0
      ? "目前您住家附近藥局全無口罩了! 明天再試試!"
      : `附近口罩資訊如下：${list.map(
          (i) =>
            `${i.name}  ${i.phone} ${i.address} 成人尚有${i.mask_adult}個，小孩尚有${i.mask_child}個`
        )}`;
  if (!conv.surface.capabilities.has("actions.capability.SCREEN_OUTPUT")) {
    return conv.close(t);
  }
  let items = list.map((i) => {
    let url = `https://www.google.com/maps/dir/?api=1&dir_action=navigate&destination=${i.geometry.coordinates[1]},${i.geometry.coordinates[0]}`;
    let description = `成人尚有${i.mask_adult}個，小孩尚有${i.mask_child}個`;

    return new BrowseCarouselItem({
      title: `${i.name} ${i.phone}`,
      url,
      description,
      footer: `${Math.abs(i.distance * 1000).toFixed(0)}公尺 ${i.address}`
    });
  });

  conv.ask(
    new SimpleResponse({
      speech: t,
      text: `附近口罩資訊如下： 您可點擊下列按紐直接開啟導航。`
    })
  );

  conv.ask(
    new BrowseCarousel({
      items
    })
  );
  return conv.close();
};

const expressApp = express().use(bodyParser.json());

expressApp.get("/", (req, rep) => rep.end("hello")).post("/fulfillment", app);

expressApp.listen(8080);
