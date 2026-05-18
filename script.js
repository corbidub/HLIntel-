const timeNodes = document.querySelectorAll("[data-live-time]");

function formatUtcTime() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date());
}

function updateLiveTime() {
  const time = `${formatUtcTime()} UTC`;
  timeNodes.forEach((node) => {
    node.textContent = time;
  });
}

updateLiveTime();
setInterval(updateLiveTime, 1000);
