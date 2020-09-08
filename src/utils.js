const fetch = require("node-fetch");
module.exports = async (longitude, latitude) => {
  return new Promise((resolve, reject) => {
    let cy = latitude;
    let cx = longitude;

    let pa = [0, 0],
      pc = [0, 0];
    pa[0] = cx - 0.01;
    pc[0] = cx + 0.01;

    pa[1] = cy - 0.01;
    pc[1] = cy + 0.01;

    fetch(
      "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json"
    )
      .then((res) => res.json())
      .then((json) => {
        // console.log(json.features[0]);
        let ary = [];
        let list = json.features;
        list.map((i) => {
          let c = i.geometry.coordinates;
          if (
            c[0] > pa[0] &&
            c[0] < pc[0] &&
            c[1] > pa[1] &&
            c[1] < pc[1] &&
            i.properties.mask_adult > 0
          ) {
            ary.push({
              ...i,
              ...i.properties,
              distance:
                Math.sqrt(Math.pow(c[0] - cx, 2) + Math.pow(c[1] - cy, 2)) * 100
            });
          }
          return ary;
        });

        ary.sort((a, b) => {
          return a.properties.mask_adult > b.properties.mask_adult ? 1 : 0;
        });
        ary.length = 3;

        resolve(ary);
      });
  });
};
