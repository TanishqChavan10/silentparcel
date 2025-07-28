/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: false,
	},

	images: {
		domains: ["api.dicebear.com"],
		formats: ["image/webp", "image/avif"],
	},

  serverExternalPackages: ["ioredis"],


	compiler: {
		removeConsole: false,
	},

	webpack: (config, { isServer }) => {
		config.ignoreWarnings = [
			(warning) =>
				typeof warning.message === "string" &&
				warning.message.includes(
					"Critical dependency: the request of a dependency is an expression"
				),
		];

		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				net: false,
				tls: false,
				crypto: false,
			};
		}

		return config;
	},

	async headers() {
		return [
			{
				source: "/api/:path*",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "X-XSS-Protection", value: "1; mode=block" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				],
			},
		];
	},

	poweredByHeader: false,
	compress: true,
};

module.exports = nextConfig;
