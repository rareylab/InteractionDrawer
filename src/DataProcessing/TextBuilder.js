/**
 * Converts currently stored data to a string representation.
 */
class TextBuilder {
    /**
     * Contains instances for data access and configuration options.
     *
     * @param sceneData {Object} - data storage
     */
    constructor(sceneData) {
        this.sceneData = sceneData;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Serializes the interaction data of the draw area and then returns it as string.
     *
     * @returns {Object} - blob of serialized interaction data
     */
    getInteractionsText() {
        let text = '';
        text += 'Interactions:\n\n';
        for (const type of ['atomPairInteractions', 'cationPiStackings', 'piStackings']) {
            for (const interactionId in this.sceneData.intermolecularData[type]) {
                const interaction = this.sceneData.intermolecularData[type][interactionId];
                if (!interaction.enabled) {
                    continue;
                }
                const structures = this.sceneData.structuresData.structures;
                const fromStructure = structures[interaction.fromStructure];
                const toStructure = structures[interaction.toStructure];
                let from, to;
                if (type === "atomPairInteractions") {
                    let firstType = "";
                    let secondType = "";
                    from = fromStructure.atomsData.getAtom(interaction.from);
                    to = toStructure.atomsData.getAtom(interaction.to);
                    if (from.isMetal() || to.isMetal()) {
                        if ((!from.additionalInformation || !from.additionalInformation.infileId) ||
                            (!to.additionalInformation || !to.additionalInformation.infileId)) {
                            continue;
                        }
                        text += "Metal interaction";
                        text += ": ";
                    } else if ((from.charge > 0 && to.charge < 0) ||
                        (from.charge < 0 && to.charge > 0)) {
                        if ((!from.additionalInformation || !from.additionalInformation.infileId) ||
                            (!to.additionalInformation || !to.additionalInformation.infileId)) {
                            continue;
                        }
                        if (from.charge > 0 && to.charge < 0) {
                            firstType = "Cation";
                            secondType = "Anion";
                        } else if (from.charge < 0 && to.charge > 0) {
                            firstType = "Anion";
                            secondType = "Cation";
                        }
                        text += "Ionic interaction";
                        text += ": ";
                    } else if (from.isHydrogen()) {
                        from = fromStructure.atomsData.getAtom(
                            fromStructure.atomsData.neighbors[from.id][0].neighbor)
                        if ((!from.additionalInformation || !from.additionalInformation.infileId) ||
                            (!to.additionalInformation || !to.additionalInformation.infileId)) {
                            continue;
                        }
                        text += "Hydrogen bond";
                        text += ": ";
                        firstType = "Donor";
                        secondType = "Acceptor";
                    } else if (to.isHydrogen()) {
                        to = toStructure.atomsData.getAtom(
                            toStructure.atomsData.neighbors[to.id][0].neighbor)
                        if ((!from.additionalInformation || !from.additionalInformation.infileId) ||
                            (!to.additionalInformation || !to.additionalInformation.infileId)) {
                            continue;
                        }
                        text += "Hydrogen bond";
                        text += ": ";
                        secondType = "Donor";
                        firstType = "Acceptor";
                    } else {
                        continue;
                    }
                    text +=
                        firstType + " " +
                        from.additionalInformation.infileId + ":" +
                        from.additionalInformation.atomName + " (" +
                        fromStructure.structureLabel + ") "
                        + "- " +
                        secondType + " " +
                        to.additionalInformation.infileId + ":" +
                        to.additionalInformation.atomName + " (" +
                        toStructure.structureLabel + ")";
                    text += '\n';
                } else if (type === "cationPiStackings") {
                    from = fromStructure.ringsData.rings[interaction.from];
                    to = toStructure.atomsData.getAtom(interaction.to);
                    for (const atom of from.atoms) {
                        if (!atom.additionalInformation || !atom.additionalInformation.infileId) {
                            continue;
                        }
                    }
                    if (!to.additionalInformation || !to.additionalInformation.infileId) {
                        continue;
                    }
                    text += "Cation-pi interaction";
                    text += ": ";
                    const ringAtoms = [];
                    for (const atom of from.atoms) {
                        ringAtoms.push(atom.additionalInformation.infileId +
                            ":" + atom.additionalInformation.atomName);
                    }
                    text += ringAtoms.join(";");
                    text += " (" + fromStructure.structureLabel + ") ";
                    text += "- ";
                    text += to.additionalInformation.infileId + ":" +
                        to.additionalInformation.atomName + " (" + toStructure.structureLabel + ")";
                    text += '\n';
                } else if (type === "piStackings") {
                    from = fromStructure.ringsData.rings[interaction.from];
                    to = toStructure.ringsData.rings[interaction.to];
                    for (const atom of from.atoms) {
                        if (!atom.additionalInformation  || !atom.additionalInformation.infileId) {
                            continue;
                        }
                    }
                    for (const atom of to.atoms) {
                        if (!atom.additionalInformation  || !atom.additionalInformation.infileId) {
                            continue;
                        }
                    }
                    text += "Pi-pi interaction";
                    text += ": ";
                    const ringAtomsFrom = [];
                    for (const atom of from.atoms) {
                        ringAtomsFrom.push(atom.additionalInformation.infileId +
                            ":" + atom.additionalInformation.atomName);
                    }
                    const ringAtomsTo = [];
                    for (const atom of from.atoms) {
                        ringAtomsTo.push(atom.additionalInformation.infileId +
                            ":" + atom.additionalInformation.atomName);
                    }
                    text += ringAtomsFrom.join(";");
                    text += " (" + fromStructure.structureLabel + ") ";
                    text += "- ";
                    text += ringAtomsTo.join(";");
                    text += " (" + toStructure.structureLabel + ") ";
                    text += '\n';
                }
            }
        }
        text += "\nHydrophobic Contacts:\n\n"
        for (const annotationId in this.sceneData.annotationsData.annotations) {
            const annotation = this.sceneData.annotationsData.annotations[annotationId];
            if (annotation.type === 'structureSpline' && annotation.enabled) {
                text += annotation.label;
                text += '\n';
            }
        }
        return text;
    }
}