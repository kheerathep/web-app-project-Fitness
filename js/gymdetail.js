// Configure Tailwind CSS
// This runs before the Tailwind CDN processes the DOM
tailwind.config = {
    theme: {
        extend: {
            colors: {
                "primary": "#dc2626", // Bold Red
                "primary-hover": "#b91c1c", // Darker Red
                "surface": "#f8fafc", // Very light gray for cards
                "surface-dark": "#0f172a",
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "1rem",
                "lg": "2rem",
                "xl": "3rem",
                "full": "9999px"
            },
        },
    },
};