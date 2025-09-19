export default function PriorityMark({ priority }) {
  const getPriorityMark = (priority) => {
    switch (priority) {
      case "Critical":
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
        );
      case "High":
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          </div>
        );
      case "Medium":
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
        );
      case "Low":
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return getPriorityMark(priority);
}
