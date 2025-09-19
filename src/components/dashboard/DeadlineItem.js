export default function DeadlineItem({ deadline }) {
  const { priority, title, client, dueDate, type } = deadline;
  const dueDateObj = new Date(dueDate);
  const now = new Date();
  const daysUntilDue = Math.ceil((dueDateObj - now) / (1000 * 60 * 60 * 24));
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getProgressBarColor = (priority) => {
    switch (priority) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const formatDueDate = (date) => {
    if (daysUntilDue === 0) return "Today";
    if (daysUntilDue === 1) return "Tomorrow";
    if (daysUntilDue < 7) return `In ${daysUntilDue} days`;
    return date.toLocaleDateString();
  };

  // Calculate progress percentage (assuming max 30 days for progress bar)
  const maxDays = 30;
  const progressPercentage = Math.min(Math.max((maxDays - daysUntilDue) / maxDays * 100, 0), 100);

  return (
    <li className={`flex flex-col border rounded-lg px-3 py-3 bg-white/80 shadow-sm ${getPriorityColor(priority)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{title}</div>
          <div className="text-xs opacity-75 truncate">{client}</div>
        </div>
        <div className="text-right ml-3">
          <div className="text-xs font-medium">{formatDueDate(dueDateObj)}</div>
          <div className="text-xs opacity-75 capitalize">{priority}</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(priority)}`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* Days remaining indicator */}
      <div className="flex justify-between items-center text-xs opacity-75">
        <span>{daysUntilDue > 0 ? `${daysUntilDue} days left` : 'Due today'}</span>
        <span className="capitalize">{type.replace('_', ' ')}</span>
      </div>
    </li>
  );
}
