// Simple toast utility to replace sonner until it's installed
export const toast = {
  success: (message: string) => {
    console.log('✅ Success:', message);
    // You can replace this with your preferred toast implementation
    alert(`✅ ${message}`);
  },
  
  error: (message: string) => {
    console.error('❌ Error:', message);
    // You can replace this with your preferred toast implementation  
    alert(`❌ ${message}`);
  },
  
  info: (message: string) => {
    console.log('ℹ️ Info:', message);
    // You can replace this with your preferred toast implementation
    alert(`ℹ️ ${message}`);
  },
  
  warning: (message: string) => {
    console.warn('⚠️ Warning:', message);
    // You can replace this with your preferred toast implementation
    alert(`⚠️ ${message}`);
  }
}; 