const turf = require('@turf/turf');

function checkPointInPaths() {
  // Define a set of polygon paths
  const paths = [
    [
      { lat: 26.89419872208534, lng: 75.76432576673085 },
      { lat: 26.894964194766064, lng: 75.82406392591054 },
      { lat: 26.863728698988737, lng: 75.80449452893788 },
      { lat: 26.865413186050223, lng: 75.76209416883046 }
    ],
    [
      { lat: 26.90119872208534, lng: 75.76132576673085 },
      { lat: 26.901964194766064, lng: 75.82106392591054 },
      { lat: 26.870728698988737, lng: 75.80149452893788 },
      { lat: 26.872413186050223, lng: 75.75909416883046 }
    ]
  ];

  // Point to check
  const pointToCheck = { lat: 26.8650, lng: 75.8000 };
  const point = turf.point([pointToCheck.lng, pointToCheck.lat]);

  // Check which path contains the point
  let foundInPathIndex = -1;

  paths.forEach((path, index) => {
    // Convert the path to GeoJSON polygon format
    const polygonCoordinates = path.map(point => [point.lng, point.lat]);
    polygonCoordinates.push([path[0].lng, path[0].lat]); // Close the polygon loop

    const polygon = turf.polygon([polygonCoordinates]);

    // Check if the point is inside the polygon
    const isWithin = turf.booleanPointInPolygon(point, polygon);
    if (isWithin) {
      foundInPathIndex = index;
    }
  });

  // Output result
  if (foundInPathIndex !== -1) {
    console.log(`The point is inside polygon at index ${foundInPathIndex}.`);
  } else {
    console.log('The point is not inside any polygon.');
  }
}

// Run the function
checkPointInPaths();
