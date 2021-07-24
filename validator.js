function Validator(options) {

    function getParent(element,selector) {
        while(element.parentElement) {
            if(element.parentElement.matches(selector)){
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {}

    //Hàm thực hiện validate
    var validate = function(inputElement,rule) {
        var errorElement =getParent(inputElement,options.formGroupSelector).querySelector(options.errorSelector);
        var errorMessage
        //Lấy ra các rules của selector
        var rules = selectorRules[rule.selector]
        
        //Lặp qua từng rule & kiểm tra
        //Nếu có lỗi thì dừng kiểm tra
        for(let i = 0; i<rules.length; i++) {
            switch(inputElement.type) {
                case 'checkbox': case 'radio' :{
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector +':checked')
                    )
                    break;
                }
                default :
                    errorMessage = rules[i](inputElement.value)
            }   
            if(errorMessage)
                break;
        }
        if(errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement,options.formGroupSelector).classList.add('invalid')
        }else {
            errorElement.innerText=''
            getParent(inputElement,options.formGroupSelector).classList.remove('invalid')
        }

        return errorMessage
    }



    //Lấy element của form cần validate
    var formElement = document.querySelector(options.form)
    if(formElement){

        //Thực hiện lặp qua từng rule và validate
        formElement.onsubmit = function (e) {
            e.preventDefault()

            isFormValid = true;

            options.rules.forEach(function (rule) { 
                var inputElement = formElement.querySelector(rule.selector)
                var isValid = !validate(inputElement,rule) //hợp lệ khi validate trả về true ,tức là errorMessage = false
                if(!isValid){
                    isFormValid = false;
                }
            })
            
            
            if(isFormValid) {
                //TH submit với JS
                if(typeof options.onSubmit ==='function') {

                    var enableInputs = formElement.querySelectorAll('[name]:not([disabled])')
                    
                    var formValues = Array.from(enableInputs).reduce(function(values,input){
                        
                        switch(input.type){
                            case 'radio':{
                                if(input.matches(':checked')){ 
                                    values[input.name] = input.value
                                }
                                
                                break;
                            }
                            case 'checkbox':{
                                if(!input.matches(':checked')) 
                                    return values;
                                    
                                if(!Array.isArray(values[input.name])){
                                    values[input.name] =[]
                                }
                                values[input.name].push(input.value);
                                break;
                            }
                            case 'file':{
                                values[input.name]=input.files
                                break;
                            }
                            default:
                                values[input.name] = input.value
                                break;

                        }
                        return values
                    },{})         
                    options.onSubmit(formValues)
                }
                else{
                    //TH submit với hành mi mặc định
                    formElement.submit();

                }
            }
            
        }

        //Lặp qua mỗi rule và xử lí (lắng nghe sự kiện blur,input...)
        options.rules.forEach(function (rule) {   

            //Lưu lại các rule cho mỗi input
            if(Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)   
            }else {
                selectorRules[rule.selector] = [rule.test]     
            }

            var inputElements = formElement.querySelectorAll(rule.selector)
            
            Array.from(inputElements).forEach((inputElement) =>{
                //Xử lí TH blur ra khỏi input
                inputElement.onblur = function () {
                    validate(inputElement,rule)
                }

                //Xử lí TH khi người dùng nhập vào input
                inputElement.oninput = function () {
                    var errorElement = getParent(inputElement,options.formGroupSelector).querySelector(options.errorSelector);
                    errorElement.innerText=''
                    getParent(inputElement,options.formGroupSelector).classList.remove('invalid')
                }
            })
           
        })
    }
}


//Định nghĩa các rule
//Nguyên tắc các rules
//1.Khi có lỗi -> Trả message lỗi
//2.Khi hợp lệ -> không trả gì cả(undefined)
Validator.isRequired = function(selector,message) {
    return {
        selector: selector,
        test: function(value){
            return value ? undefined : message ||'Vui lòng nhập trường này'
        }
    }

}
Validator.isEmail = function(selector,message) {
    return {
        selector: selector,
        test: function(value){
            var regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
            return regex.test(value) ? undefined : message || 'Nhập đúng email' //test ở đây là 1 hàm có sẵn trong thư viện, k phải là hàm test tự định nghĩa ở trên
            //C2: return value.match(regex) ? undefined : 'Nhập đúng email'
        }
    }
}

Validator.isMinLength = function(selector,min,message) {
    return {
        selector: selector,
        test: function(value){
            return value.length>=min ? undefined : message ||`Nhập tối thiểu ${min} kí tự`
        }
    }
}
Validator.isConfirmed = function(selector,getConfirmed,message) {
    return {
        selector: selector,
        test: function(value){
            return value===getConfirmed() ? undefined : message || 'Gía trị nhập vào không chính xác';
        }
    }
}
