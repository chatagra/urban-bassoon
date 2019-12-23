import Loader from './loader';

const args = process.argv.slice(2);

const loader = new Loader();
loader.getFiles(args);
loader.parseFiles();