import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ManuscriptRegistryModule = buildModule("ManuscriptRegistryModule", (m) => {
	const maxManuscriptsPerQuery = m.getParameter("maxManuscriptsPerQuery", 20);
	const maxChainDepth = m.getParameter("maxChainDepth", 50);

	const manuscriptRegistry = m.contract("ManuscriptRegistry", [maxManuscriptsPerQuery, maxChainDepth]);

	return { manuscriptRegistry };
});

export default ManuscriptRegistryModule;