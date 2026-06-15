const path = require('path');
try {
  const resolvedPath = require.resolve('@prisma/client');
  console.log('PRISMA CLIENT PATH:', resolvedPath);
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  // Check Environment model fields by inspecting dmmf
  const dmmf = prisma._dmmf || prisma._engine?._dmmf;
  if (dmmf) {
    const envModel = dmmf.datamodel?.models?.find(m => m.name === 'Environment');
    if (envModel) {
      console.log('Environment model fields:', envModel.fields.map(f => f.name));
    } else {
      console.log('Environment model not found in DMMF');
    }
  } else {
    // Fallback: check keys of a sample environment query structure
    console.log('DMMF not available, models:', Object.keys(prisma).filter(k => !k.startsWith('_')));
  }
} catch (e) {
  console.error('Error resolving Prisma client:', e);
}
