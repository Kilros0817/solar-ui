let __web3AuthInstance: any = null;

export const setWeb3AuthInstance = (instance: any) => {
  __web3AuthInstance = instance;
};

export const getWeb3AuthInstance = () => __web3AuthInstance;


