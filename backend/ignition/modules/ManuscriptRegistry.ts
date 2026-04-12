import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ManuscriptRegistryModule = buildModule("ManuscriptRegistryModule", (m) => {
	const maxManuscriptsPerQuery = m.getParameter("maxManuscriptsPerQuery", 20);
	
	const manuscriptRegistry = m.contract("ManuscriptRegistry", [maxManuscriptsPerQuery]);

	return { manuscriptRegistry };
});

export default ManuscriptRegistryModule;