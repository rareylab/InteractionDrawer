# Prerequisites

To utilise the library, you will need following JavaScript libraries.

D3 (https://d3js.org/)

fraction (https://github.com/infusion/Fraction.js/)

smiles-drawer (https://github.com/reymond-group/smilesDrawer)

The tests are based on the Jasmine framework (https://github.com/jasmine/jasmine-gem)

# Setup

The InteractionDrawer's source files are located in the ```src``` folder. The library was developed 
for a Rails application whose assets pipeline automatically handles its compression into one file.

For each SVG draw area you want to fill with drawings created by the InteractionDrawer, you need to
create a separate InteractionDrawer instance, which is then provided with a ligand name and a 
PDB code, a ProteinsPlus id of an uploaded PDB file, or the content of a PDB file. 
InteractionDrawer queries with this information the REST API of ProteinsPlus for the calculation of
diagrams in JSON format, which are subsequently drawn. 
The corresponding REST API documentation can be found at https://proteins.plus/help/index.
If you want to handle the communication with the REST API or the diagram calculation yourself, 
a scene in JSON format can be directly provided as input.

For a SVG with ```id="draw-area"```, the way to create an interactive scene should look somewhat
like the following:

```javascript
//set options as you like, see also Options.md
const opts = {
    textSize: 6.5,
    colors: {
        ionicInteractions: '#ff00ff',
        AL: '#BFA6A6'
    }
};
//initialize the drawer
const drawer = new InteractionDrawer.Drawer('draw-area', opts);
```

JSON
Via a ```json``` variable containing a string JSON diagram (see JSON.md).
```javascript
drawer.addByJSON(json);
```

PDB code and ligand name
Via a ```id``` variable that can either be a four-letter PDB code or a ProteinsPlus id of an
uploaded PDB file and a ```ligandName``` variable that contains a ligand name in the format
molecule_chain_number, e.g., 4SP_A_1298.
```javascript
drawer.addById(id, ligandName);
```

PDB file and ligand name
Via a ```fileContent``` variable that contains the content PDB file as string and a ```ligandName```
variable that contains a ligand name in the format molecule_chain_number, e.g., 4SP_A_1298.
```javascript
drawer.addByFile(id, fileContent);
```

After the setup of the InteractionDrawer instance, several callbacks functions can be set with
```drawer.setCallbacks()```.

You can access and manipulate the data in ```drawer.sceneData``` and the view in
```drawer.svgComponent``` directly or via classes and methods exposed by
```drawer.userInteractionHandler``` and ```drawer.svgDrawer```.

In addition, the InteractionDrawer library also provides several classes and methods contained in
files in the DataProcessing (functions for manipulating the data), Utils (generic functions),
and GeometryCalculation (geometric functions) folders that can be used to process the scene.
A diagram can be exported as SVG (```drawer.getSvgBlob()```), JSON with and without the current
config (```drawer.getJson```, ```drawer.getJsonBlob```, ```drawer.getJsonBlobWithConfig```) and
text file with information about occurring intermolecular interactions (```drawer.getTxtBlob```).
