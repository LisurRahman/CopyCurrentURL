(async () => {
  const showToast = async (message, isError = false) => {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!activeTab?.id) {
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: (toastMessage, toastIsError) => {
        const existingToast = document.getElementById("copy-current-url-toast");
        existingToast?.remove();

        const toast = document.createElement("div");
        toast.id = "copy-current-url-toast";
        toast.textContent = toastMessage;
        toast.style.cssText = `
          position: fixed;
          left: 50%;
          bottom: 30px;
          z-index: 2147483647;
          transform: translate(-50%, 16px);
          padding: 10px 18px;
          border-radius: 6px;
          background: ${toastIsError ? "#e06158" : "#22c55e"};
          color: #ffffff;
          font: 19px/1.4 Arial, sans-serif;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
          opacity: 0;
          transition: opacity 160ms ease, transform 160ms ease;
          pointer-events: none;
        `;

        document.documentElement.appendChild(toast);
        requestAnimationFrame(() => {
          toast.style.opacity = "1";
          toast.style.transform = "translate(-50%, 0)";
        });

        setTimeout(() => {
          toast.style.opacity = "0";
          toast.style.transform = "translate(-50%, 16px)";
          setTimeout(() => toast.remove(), 180);
        }, 1800);
      },
      args: [message, isError]
    });
  };

  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    const currentTab = tabs[0];

    if (!currentTab || !currentTab.url) {
      throw new Error("URL not found");
    }

    const url = currentTab.url;

    // Use the Clipboard API if available
    try {
      await navigator.clipboard.writeText(url);
    } catch (clipboardError) {
      // Fallback method
      const textarea = document.createElement("textarea");

      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const copied = document.execCommand("copy");
      textarea.remove();

      if (!copied) {
        throw clipboardError;
      }
    }

    await showToast("📋 URL copied!");

    setTimeout(() => {
      window.close();
    }, 700);

  } catch (error) {
    console.error("Copy error:", error);
    try {
      await showToast("Failed to copy URL", true);
    } catch (toastError) {
      console.error("Toast error:", toastError);
    }

    setTimeout(() => {
      window.close();
    }, 1500);
  }
})();
