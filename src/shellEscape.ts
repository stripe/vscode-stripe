import {OSType, getOSType} from './utils';

export function shellEscape(args: Array<string>): string {
  var output: Array<string> = [];

  if (getOSType() === OSType.windows) {
    args.forEach(function(arg) {
      if (/[^A-Za-z0-9_\/:=-]/.test(arg)) {
        arg = '"' + arg.replace(/"/g, '\\"') + '"';
        arg = arg.replace(/^(?:"")+/g, '') // unduplicate double-quote at the beginning
          .replace(/\\"""/g, '\\"'); // remove non-escaped double-quote if there are enclosed between 2 escaped
      }
      output.push(arg);
    });
    return output.join(' ');
  } else {
    args.forEach(function(arg) {
      if (/[^A-Za-z0-9_\/:=-]/.test(arg)) {
        arg = "'" + arg.replace(/'/g,"'\\''") + "'";
        arg = arg.replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
          .replace(/\\'''/g, "\\'"); // remove non-escaped single-quote if there are enclosed between 2 escaped
      };
      output.push(arg);
    });
    return output.join(' ');
  };
};
